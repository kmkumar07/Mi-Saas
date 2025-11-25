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
import { CreateSubscriptionDto } from '@application/dtos/create-subscription.dto';
import { SubscriptionResponseDto } from '@application/dtos/subscription-response.dto';

@Injectable()
export class CreateSubscriptionUseCase {
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

    async execute(dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
        const account = await this.accountRepository.findById(dto.accountId);
        if (!account) {
            throw new NotFoundException(`Account ${dto.accountId} not found`);
        }

        const plan = await this.planRepository.findById(dto.planId);
        if (!plan) {
            throw new NotFoundException(`Plan ${dto.planId} not found`);
        }

        if (account.tenantId !== dto.tenantId || plan.tenantId !== dto.tenantId) {
            throw new BadRequestException('Tenant mismatch between account, plan, and request');
        }

        // Seats are driven by plan/feature configuration; we keep a default internal value.
        const seats = 1;
        const amount = plan.price.value; // amount in cents (per subscription)

        // Ensure we have a payment gateway customer
        let gatewayCustomerId = account.paymentGatewayCustomerId;
        if (!gatewayCustomerId) {
            gatewayCustomerId = await this.paymentGateway.createCustomer(account);
            account.updatePaymentMethod(account.paymentMethod || 'card', gatewayCustomerId);
            await this.accountRepository.update(account);
        }

        // Process initial payment
        const payment = new Payment({
            accountId: account.id,
            amount,
            currency: plan.price.currency,
            paymentType: 'subscription',
            paymentMethod: account.paymentMethod,
            gatewayCustomerId,
            description: `Subscription to plan ${plan.name}`,
            metadata: {
                planId: plan.id,
            },
        });

        const paymentResult = await this.paymentGateway.processPayment(
            amount,
            gatewayCustomerId,
            {
                tenantId: dto.tenantId,
                accountId: dto.accountId,
                planId: dto.planId,
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

        const savedPayment = await this.paymentRepository.create(payment);

        // Determine current period
        const { start, end } = this.calculateInitialPeriod(plan);

        // Create subscription
        const customerId = account.id; // use account as the logical customer; not exposed in API
        const subscription = new Subscription({
            accountId: account.id,
            tenantId: dto.tenantId,
            customerId,
            planId: plan.id,
            seats,
            currentPeriodStart: start,
            currentPeriodEnd: end,
            metadata: dto.metadata,
        });

        const createdSubscription = await this.subscriptionRepository.create(subscription);

        // Link payment to subscription (optional, best-effort)
        // In a real system, we'd update the payment with subscriptionId;
        // kept simple here to avoid another round-trip.
        void savedPayment;

        return this.toDto(createdSubscription);
    }

    private calculateInitialPeriod(plan: Plan): { start: Date; end: Date } {
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
                days = 1 / 24; // Less than a day, will be handled by periods
                break;
            case 'per-minute':
                days = 1 / (24 * 60);
                break;
            case 'per-second':
                days = 1 / (24 * 60 * 60);
                break;
            case 'one-time':
                days = 0; // One-time charges don't have a recurring period
                break;
            default:
                days = 30;
        }

        const periods = rcp.numberOfPeriods ?? 1;
        const totalDays = Math.max(1, days * periods); // Ensure at least 1 day for recurring subscriptions

        const end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);

        return { start, end };
    }

    private toDto(subscription: Subscription): SubscriptionResponseDto {
        return {
            id: subscription.id,
            accountId: subscription.accountId,
            tenantId: subscription.tenantId,
            customerId: subscription.customerId,
            planId: subscription.planId,
            status: subscription.status,
            seats: subscription.seats,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelledAt: subscription.cancelledAt,
            cancellationReason: subscription.cancellationReason,
            metadata: subscription.metadata,
            createdAt: subscription.createdAt,
        };
    }
}


