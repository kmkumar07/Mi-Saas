import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Subscription } from '@domain/entities/subscription.entity';
import { Plan } from '@domain/entities/plan.entity';
import { Account } from '@domain/entities/account.entity';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { IPaymentOrderRepository, PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { Payment } from '@domain/entities/payment.entity';
import { VerifyPaymentDto } from '@application/dtos/verify-payment.dto';
import { UpgradeSubscriptionResponseDto } from '@application/dtos/upgrade-subscription.dto';

@Injectable()
export class CompleteUpgradeUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
        @Inject(PAYMENT_ORDER_REPOSITORY)
        private readonly paymentOrderRepository: IPaymentOrderRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(dto: VerifyPaymentDto): Promise<UpgradeSubscriptionResponseDto> {
        // 1. Find payment order by Razorpay order ID
        const paymentOrder = await this.paymentOrderRepository.findByRazorpayOrderId(dto.orderId);
        if (!paymentOrder) {
            throw new NotFoundException(`Payment order with Razorpay order ID ${dto.orderId} not found`);
        }

        // 2. Verify this is an upgrade payment order
        if (!paymentOrder.metadata?.upgrade) {
            throw new BadRequestException('This payment order is not for an upgrade');
        }

        // 3. Get the old subscription
        const oldSubscriptionId = paymentOrder.metadata.oldSubscriptionId || paymentOrder.subscriptionId;
        if (!oldSubscriptionId) {
            throw new NotFoundException('Old subscription ID not found in payment order');
        }

        const existingSubscription = await this.subscriptionRepository.findById(oldSubscriptionId);
        if (!existingSubscription) {
            throw new NotFoundException(`Subscription with ID ${oldSubscriptionId} not found`);
        }

        // 4. Verify payment if payment ID is provided
        if (dto.paymentId) {
            const paymentStatus = await this.paymentGateway.getPaymentStatus(dto.paymentId);
            
            if (paymentStatus !== 'completed') {
                throw new BadRequestException(`Payment status is ${paymentStatus}, expected completed`);
            }

            // Create payment record
            const account = await this.accountRepository.findById(existingSubscription.accountId);
            if (!account) {
                throw new NotFoundException(`Account ${existingSubscription.accountId} not found`);
            }

            // Get payment details from Razorpay if available
            const razorpayGateway = this.paymentGateway as any;
            let paymentEntity: any = null;
            
            if (razorpayGateway.razorpay) {
                try {
                    paymentEntity = await razorpayGateway.razorpay.payments.fetch(dto.paymentId);
                } catch (err) {
                    console.error('[COMPLETE UPGRADE] Error fetching payment details from Razorpay:', err);
                }
            }

            const payment = new Payment({
                accountId: account.id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                status: 'completed',
                gatewayPaymentId: dto.paymentId,
                gatewayCustomerId: paymentEntity?.customer_id || account.paymentGatewayCustomerId,
                paymentMethod: paymentEntity?.method || account.paymentMethod || 'card',
                paymentType: 'upgrade',
                description: `Upgrade payment for subscription ${oldSubscriptionId}`,
                metadata: {
                    razorpayOrderId: dto.orderId,
                    razorpayPaymentId: dto.paymentId,
                    paymentEntity: paymentEntity || {},
                    upgrade: true,
                    oldSubscriptionId: oldSubscriptionId,
                    oldPlanId: paymentOrder.metadata.oldPlanId,
                    newPlanId: paymentOrder.planId,
                    proration: paymentOrder.metadata.proration,
                },
            });

            await this.paymentRepository.create(payment);

            // Mark payment order as paid
            if (!paymentOrder.isPaid()) {
                paymentOrder.markAsPaid(payment.id);
                await this.paymentOrderRepository.update(paymentOrder);
            }
        }

        // 5. Get plans
        const currentPlan = await this.planRepository.findById(existingSubscription.planId);
        if (!currentPlan) {
            throw new NotFoundException(`Current plan ${existingSubscription.planId} not found`);
        }

        const newPlan = await this.planRepository.findById(paymentOrder.planId);
        if (!newPlan) {
            throw new NotFoundException(`New plan ${paymentOrder.planId} not found`);
        }

        // 6. Calculate proration (for response)
        const proration = paymentOrder.metadata?.proration || 
            existingSubscription.calculateUpgradeAmount(currentPlan, newPlan);

        // 7. Archive the old subscription (cancel it)
        existingSubscription.cancel('Upgraded to new plan');
        await this.subscriptionRepository.update(existingSubscription);

        // 8. Create new subscription with the new plan
        // Use the same period end date as the old subscription for continuity
        const newSubscription = new Subscription({
            accountId: existingSubscription.accountId,
            tenantId: existingSubscription.tenantId,
            customerId: existingSubscription.customerId,
            planId: newPlan.id,
            seats: existingSubscription.seats,
            status: 'active',
            currentPeriodStart: existingSubscription.currentPeriodStart,
            currentPeriodEnd: existingSubscription.currentPeriodEnd,
            metadata: {
                ...existingSubscription.metadata,
                upgradedFrom: existingSubscription.id,
                upgradedAt: new Date().toISOString(),
                paymentOrderId: paymentOrder.id,
            },
        });

        const createdSubscription = await this.subscriptionRepository.create(newSubscription);

        // 9. Return response
        return {
            oldSubscriptionId: existingSubscription.id,
            newSubscriptionId: createdSubscription.id,
            proratedAmount: proration.amountDue,
            currency: newPlan.price.currency,
            daysRemaining: proration.daysRemaining,
            daysInPeriod: proration.daysInPeriod,
            proratedCredit: proration.proratedCredit,
            currentPlanCost: proration.currentPlanCost,
            newPlanCost: proration.newPlanCost,
        };
    }
}

