import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { IPaymentOrderRepository, PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { PaymentOrder } from '@domain/entities/payment-order.entity';
import { Subscription } from '@domain/entities/subscription.entity';
import { CreatePaymentOrderDto } from '@application/dtos/create-payment-order.dto';
import { PaymentOrderResponseDto } from '@application/dtos/payment-order-response.dto';

@Injectable()
export class CreatePaymentOrderUseCase {
    constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PAYMENT_ORDER_REPOSITORY)
        private readonly paymentOrderRepository: IPaymentOrderRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(dto: CreatePaymentOrderDto): Promise<PaymentOrderResponseDto> {
        // Validate account
        const account = await this.accountRepository.findById(dto.accountId);
        if (!account) {
            throw new NotFoundException(`Account ${dto.accountId} not found`);
        }

        // Validate plan
        const plan = await this.planRepository.findById(dto.planId);
        if (!plan) {
            throw new NotFoundException(`Plan ${dto.planId} not found`);
        }

        // Validate tenant match
        if (account.tenantId !== dto.tenantId) {
            throw new BadRequestException('Tenant mismatch between account and request');
        }

        // Ensure we have a payment gateway customer
        let gatewayCustomerId = account.paymentGatewayCustomerId;
        if (!gatewayCustomerId) {
            gatewayCustomerId = await this.paymentGateway.createCustomer(account);
            account.updatePaymentMethod(account.paymentMethod || 'card', gatewayCustomerId);
            await this.accountRepository.update(account);
        }

        // Calculate amount from plan
        const amount = plan.price.value; // Amount in paise/cents
        const currency = plan.price.currency || 'INR';

        // Create subscription with incomplete status (will be activated after payment)
        const seats = 1;
        const { start, end } = this.calculateInitialPeriod(plan);
        const customerId = account.id;

        const subscription = new Subscription({
            accountId: account.id,
            tenantId: dto.tenantId,
            customerId,
            planId: plan.id,
            seats,
            status: 'incomplete',
            currentPeriodStart: start,
            currentPeriodEnd: end,
            metadata: {
                paymentOrderFlow: true,
            },
        });

        const createdSubscription = await this.subscriptionRepository.create(subscription);

        // Create Razorpay order
        // Receipt must be max 40 characters (Razorpay requirement)
        // Format: "sub-{first8chars}-{timestamp}" = max 8 + 1 + 8 + 1 + 13 = 31 chars
        const subIdShort = createdSubscription.id.substring(0, 8);
        const timestamp = Date.now();
        const receipt = `sub-${subIdShort}-${timestamp}`;
        const orderResult = await this.paymentGateway.createOrder(
            amount,
            currency,
            receipt,
            {
                tenantId: dto.tenantId,
                accountId: dto.accountId,
                planId: dto.planId,
                subscriptionId: createdSubscription.id,
            },
        );

        // Create payment order record
        const paymentOrder = new PaymentOrder({
            accountId: account.id,
            subscriptionId: createdSubscription.id,
            planId: plan.id,
            razorpayOrderId: orderResult.orderId,
            amount,
            currency,
            status: 'created',
            metadata: {
                receipt,
                gatewayResponse: orderResult.gatewayResponse,
            },
        });

        const createdPaymentOrder = await this.paymentOrderRepository.create(paymentOrder);

        return {
            orderId: createdPaymentOrder.id,
            razorpayOrderId: orderResult.orderId,
            amount,
            currency,
            keyId: orderResult.keyId,
            subscriptionId: createdSubscription.id,
        };
    }

    private calculateInitialPeriod(plan: any): { start: Date; end: Date } {
        const start = new Date();
        const rcp = plan.price.recurringChargePeriod;

        // Simple approximation based on charge frequency
        const freq = rcp.chargeFrequency;
        let days = 30;

        switch (freq) {
            case 'daily':
                days = 1;
                break;
            case 'weekly':
                days = 7;
                break;
            case 'fortnightly':
                days = 14;
                break;
            case 'monthly':
                days = 30;
                break;
            case 'hourly':
                days = 1 / 24;
                break;
            case 'per-minute':
                days = 1 / (24 * 60);
                break;
            case 'per-second':
                days = 1 / (24 * 60 * 60);
                break;
            case 'one-time':
                days = 0;
                break;
            default:
                days = 30;
        }

        const periods = rcp.numberOfPeriods ?? 1;
        const totalDays = Math.max(1, days * periods);

        const end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);

        return { start, end };
    }
}

