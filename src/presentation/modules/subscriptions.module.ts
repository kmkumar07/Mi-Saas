import { Module } from '@nestjs/common';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { CreateSubscriptionUseCase } from '@application/use-cases/subscriptions/create-subscription.use-case';
import { SubscriptionRepository } from '@infrastructure/database/repositories/subscription.repository';
import { PlanRepository } from '@infrastructure/database/repositories/plan.repository';
import { AccountRepository } from '@infrastructure/database/repositories/account.repository';
import { PaymentRepository } from '@infrastructure/database/repositories/payment.repository';
import { MockPaymentGatewayService } from '@infrastructure/services/mock-payment-gateway.service';
import { SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';

@Module({
    controllers: [SubscriptionsController],
    providers: [
        CreateSubscriptionUseCase,
        {
            provide: SUBSCRIPTION_REPOSITORY,
            useClass: SubscriptionRepository,
        },
        {
            provide: PLAN_REPOSITORY,
            useClass: PlanRepository,
        },
        {
            provide: ACCOUNT_REPOSITORY,
            useClass: AccountRepository,
        },
        {
            provide: PAYMENT_REPOSITORY,
            useClass: PaymentRepository,
        },
        {
            provide: PAYMENT_GATEWAY,
            useClass: MockPaymentGatewayService,
        },
    ],
})
export class SubscriptionsModule { }


