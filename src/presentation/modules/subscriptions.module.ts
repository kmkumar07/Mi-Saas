import { Module } from '@nestjs/common';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { CreateSubscriptionUseCase } from '@application/use-cases/subscriptions/create-subscription.use-case';
import { UpgradeSubscriptionUseCase } from '@application/use-cases/subscriptions/upgrade-subscription.use-case';
import { CreateUpgradePaymentOrderUseCase } from '@application/use-cases/subscriptions/create-upgrade-payment-order.use-case';
import { CompleteUpgradeUseCase } from '@application/use-cases/subscriptions/complete-upgrade.use-case';
import { CalculateProrationUseCase } from '@application/use-cases/subscriptions/calculate-proration.use-case';
import { SubscriptionRepository } from '@infrastructure/database/repositories/subscription.repository';
import { PaymentOrderRepository } from '@infrastructure/database/repositories/payment-order.repository';
import { PlanRepository } from '@infrastructure/database/repositories/plan.repository';
import { AccountRepository } from '@infrastructure/database/repositories/account.repository';
import { PaymentRepository } from '@infrastructure/database/repositories/payment.repository';
import { RazorpayPaymentGatewayService } from '@infrastructure/services/razorpay-payment-gateway.service';
import { SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { PlansModule } from '../../plans.module';

@Module({
    imports: [PlansModule],
    controllers: [SubscriptionsController],
    providers: [
        CreateSubscriptionUseCase,
        UpgradeSubscriptionUseCase,
        CreateUpgradePaymentOrderUseCase,
        CompleteUpgradeUseCase,
        CalculateProrationUseCase,
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
            provide: PAYMENT_ORDER_REPOSITORY,
            useClass: PaymentOrderRepository,
        },
        {
            provide: PAYMENT_GATEWAY,
            useClass: RazorpayPaymentGatewayService,
        },
    ],
})
export class SubscriptionsModule { }


