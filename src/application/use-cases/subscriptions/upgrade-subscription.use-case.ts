import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Subscription } from '@domain/entities/subscription.entity';
import { Plan } from '@domain/entities/plan.entity';
import { Account } from '@domain/entities/account.entity';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { Payment } from '@domain/entities/payment.entity';
import { UpgradeSubscriptionDto } from '@application/dtos/upgrade-subscription.dto';
import { UpgradeSubscriptionResponseDto } from '@application/dtos/upgrade-subscription.dto';

@Injectable()
export class UpgradeSubscriptionUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(dto: UpgradeSubscriptionDto): Promise<UpgradeSubscriptionResponseDto> {
        // 1. Get existing subscription
        const existingSubscription = await this.subscriptionRepository.findById(dto.subscriptionId);
        if (!existingSubscription) {
            throw new NotFoundException(`Subscription with ID ${dto.subscriptionId} not found`);
        }

        // 2. Validate subscription can be upgraded
        if (existingSubscription.status !== 'active' && existingSubscription.status !== 'trial') {
            throw new BadRequestException(`Cannot upgrade subscription with status: ${existingSubscription.status}. Only active or trial subscriptions can be upgraded.`);
        }

        // 3. Get current and new plans
        const currentPlan = await this.planRepository.findById(existingSubscription.planId);
        if (!currentPlan) {
            throw new NotFoundException(`Current plan ${existingSubscription.planId} not found`);
        }

        const newPlan = await this.planRepository.findById(dto.newPlanId);
        if (!newPlan) {
            throw new NotFoundException(`New plan ${dto.newPlanId} not found`);
        }

        // 4. Validate upgrade is allowed
        if (!existingSubscription.canUpgradeToPlan(newPlan)) {
            throw new BadRequestException(`Cannot upgrade to plan ${newPlan.name}. The subscription may already be on this plan or the upgrade is not allowed.`);
        }

        // 4.5. Validate plans have valid prices
        if (!currentPlan.price || !currentPlan.price.value || currentPlan.price.value <= 0) {
            throw new BadRequestException(`Current plan ${currentPlan.name} has an invalid price`);
        }
        if (!newPlan.price || !newPlan.price.value || newPlan.price.value <= 0) {
            throw new BadRequestException(`New plan ${newPlan.name} has an invalid price`);
        }

        // 5. Calculate prorated amount
        const proration = existingSubscription.calculateUpgradeAmount(currentPlan, newPlan);

        // 6. Get account
        const account = await this.accountRepository.findById(existingSubscription.accountId);
        if (!account) {
            throw new NotFoundException(`Account ${existingSubscription.accountId} not found`);
        }

        // 7. Process upgrade payment (only if amount due > 0)
        if (proration.amountDue > 0) {
            // Ensure we have a payment gateway customer
            let gatewayCustomerId = account.paymentGatewayCustomerId;
            if (!gatewayCustomerId) {
                gatewayCustomerId = await this.paymentGateway.createCustomer(account);
                account.updatePaymentMethod(account.paymentMethod || 'card', gatewayCustomerId);
                await this.accountRepository.update(account);
            }

            const payment = new Payment({
                accountId: account.id,
                amount: proration.amountDue,
                currency: newPlan.price.currency,
                paymentType: 'upgrade',
                paymentMethod: account.paymentMethod,
                gatewayCustomerId,
                description: `Upgrade from ${currentPlan.name} to ${newPlan.name}`,
                metadata: {
                    subscriptionId: existingSubscription.id,
                    oldPlanId: currentPlan.id,
                    newPlanId: newPlan.id,
                    proration,
                },
            });

            const paymentResult = await this.paymentGateway.processPayment(
                proration.amountDue,
                gatewayCustomerId,
                {
                    tenantId: existingSubscription.tenantId,
                    accountId: account.id,
                    planId: newPlan.id,
                    subscriptionId: existingSubscription.id,
                },
            );

            payment.process(paymentResult.paymentId);
            if (paymentResult.success) {
                payment.complete();
            } else {
                payment.fail();
                await this.paymentRepository.create(payment);
                throw new BadRequestException(`Payment failed: ${paymentResult.errorMessage ?? 'Unknown error'}`);
            }

            await this.paymentRepository.create(payment);
        }

        // 9. Archive the old subscription (cancel it)
        existingSubscription.cancel('Upgraded to new plan');
        await this.subscriptionRepository.update(existingSubscription);

        // 10. Create new subscription with the new plan
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
            },
        });

        const createdSubscription = await this.subscriptionRepository.create(newSubscription);

        // 11. Return response
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

