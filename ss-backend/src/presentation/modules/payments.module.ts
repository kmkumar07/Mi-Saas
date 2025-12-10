import { Module } from '@nestjs/common';
import { PaymentsController } from '../controllers/payments.controller';
import { CreatePaymentOrderUseCase } from '@application/use-cases/payments/create-payment-order.use-case';
import { VerifyPaymentUseCase } from '@application/use-cases/payments/verify-payment.use-case';
import { PaymentOrderRepository } from '@infrastructure/database/repositories/payment-order.repository';
import { PaymentRepository } from '@infrastructure/database/repositories/payment.repository';
import { SubscriptionRepository } from '@infrastructure/database/repositories/subscription.repository';
import { PlanRepository } from '@infrastructure/database/repositories/plan.repository';
import { AccountRepository } from '@infrastructure/database/repositories/account.repository';
import { RazorpayPaymentGatewayService } from '@infrastructure/services/razorpay-payment-gateway.service';
import { PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository';
import { PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';

@Module({
    controllers: [PaymentsController],
    providers: [
        CreatePaymentOrderUseCase,
        VerifyPaymentUseCase,
        {
            provide: PAYMENT_ORDER_REPOSITORY,
            useClass: PaymentOrderRepository,
        },
        {
            provide: PAYMENT_REPOSITORY,
            useClass: PaymentRepository,
        },
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
            provide: PAYMENT_GATEWAY,
            useClass: RazorpayPaymentGatewayService,
        },
    ],
})
export class PaymentsModule { }

