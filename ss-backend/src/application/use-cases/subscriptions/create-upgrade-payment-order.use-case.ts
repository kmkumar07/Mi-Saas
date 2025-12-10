import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { IPaymentOrderRepository, PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { PaymentOrder } from '@domain/entities/payment-order.entity';
import { UpgradeSubscriptionDto } from '@application/dtos/upgrade-subscription.dto';
import { PaymentOrderResponseDto } from '@application/dtos/payment-order-response.dto';

@Injectable()
export class CreateUpgradePaymentOrderUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        @Inject(PAYMENT_ORDER_REPOSITORY)
        private readonly paymentOrderRepository: IPaymentOrderRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(dto: UpgradeSubscriptionDto): Promise<PaymentOrderResponseDto> {
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

        // 3.5. Get plan families to compare ranks
        let currentPlanFamilyRank: number | undefined;
        let newPlanFamilyRank: number | undefined;
        
        if (currentPlan.planFamilyId) {
            const currentPlanFamily = await this.planFamilyRepository.findById(currentPlan.planFamilyId);
            if (currentPlanFamily) {
                currentPlanFamilyRank = currentPlanFamily.rank;
            }
        }
        
        if (newPlan.planFamilyId) {
            const newPlanFamily = await this.planFamilyRepository.findById(newPlan.planFamilyId);
            if (newPlanFamily) {
                newPlanFamilyRank = newPlanFamily.rank;
            }
        }

        // 4. Validate upgrade is allowed (based on rank)
        if (!existingSubscription.canUpgradeToPlan(newPlan, currentPlanFamilyRank, newPlanFamilyRank)) {
            throw new BadRequestException(`Cannot upgrade to plan ${newPlan.name}. The new plan must have a higher rank than the current plan.`);
        }

        // 5. Validate plans have valid prices
        if (!currentPlan.price || !currentPlan.price.value || currentPlan.price.value <= 0) {
            throw new BadRequestException(`Current plan ${currentPlan.name} has an invalid price`);
        }
        if (!newPlan.price || !newPlan.price.value || newPlan.price.value <= 0) {
            throw new BadRequestException(`New plan ${newPlan.name} has an invalid price`);
        }

        // 6. Calculate prorated amount
        const proration = existingSubscription.calculateUpgradeAmount(currentPlan, newPlan);

        // 7. Get account
        const account = await this.accountRepository.findById(existingSubscription.accountId);
        if (!account) {
            throw new NotFoundException(`Account ${existingSubscription.accountId} not found`);
        }

        // 8. If amount due is 0, we can skip payment order creation
        // But for now, we'll still create the order (it will be handled in verify)
        const amount = proration.amountDue;
        const currency = newPlan.price.currency || 'INR';

        // 9. Ensure we have a payment gateway customer
        let gatewayCustomerId = account.paymentGatewayCustomerId;
        if (!gatewayCustomerId) {
            gatewayCustomerId = await this.paymentGateway.createCustomer(account);
            account.updatePaymentMethod(account.paymentMethod || 'card', gatewayCustomerId);
            await this.accountRepository.update(account);
        }

        // 10. Create Razorpay order
        // Receipt must be max 40 characters (Razorpay requirement)
        // Format: "upg-{first8chars}-{timestamp}" = max 8 + 1 + 8 + 1 + 13 = 31 chars
        const subIdShort = existingSubscription.id.substring(0, 8);
        const timestamp = Date.now();
        const receipt = `upg-${subIdShort}-${timestamp}`;
        
        const orderResult = await this.paymentGateway.createOrder(
            amount,
            currency,
            receipt,
            {
                tenantId: existingSubscription.tenantId,
                accountId: account.id,
                planId: newPlan.id,
                subscriptionId: existingSubscription.id,
                upgrade: true,
                oldPlanId: currentPlan.id,
                proration,
            },
        );

        // 11. Create payment order record
        const paymentOrder = new PaymentOrder({
            accountId: account.id,
            subscriptionId: existingSubscription.id, // Store old subscription ID for reference
            planId: newPlan.id,
            razorpayOrderId: orderResult.orderId,
            amount,
            currency,
            status: 'created',
            metadata: {
                receipt,
                gatewayResponse: orderResult.gatewayResponse,
                upgrade: true,
                oldSubscriptionId: existingSubscription.id,
                oldPlanId: currentPlan.id,
                newPlanId: newPlan.id,
                proration,
            },
        });

        const createdPaymentOrder = await this.paymentOrderRepository.create(paymentOrder);

        return {
            orderId: createdPaymentOrder.id,
            razorpayOrderId: orderResult.orderId,
            amount,
            currency,
            keyId: orderResult.keyId,
            subscriptionId: existingSubscription.id, // Return old subscription ID for reference
        };
    }
}

