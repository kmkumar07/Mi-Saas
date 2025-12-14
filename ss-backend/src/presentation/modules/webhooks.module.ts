import { Module } from '@nestjs/common';
import { WebhooksController } from '../controllers/webhooks.controller';
import { ProcessWebhookUseCase } from '@application/use-cases/payments/process-webhook.use-case';
import { WebhookEventRepository } from '@infrastructure/database/repositories/webhook-event.repository';
import { PaymentOrderRepository } from '@infrastructure/database/repositories/payment-order.repository';
import { PaymentRepository } from '@infrastructure/database/repositories/payment.repository';
import { SubscriptionRepository } from '@infrastructure/database/repositories/subscription.repository';
import { RazorpayPaymentGatewayService } from '@infrastructure/services/razorpay-payment-gateway.service';
import { WEBHOOK_EVENT_REPOSITORY } from '@domain/repositories/webhook-event.repository.interface';
import { PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { TenantActivationModule } from './tenant-activation.module';

@Module({
    imports: [TenantActivationModule],
    controllers: [WebhooksController],
    providers: [
        ProcessWebhookUseCase,
        {
            provide: WEBHOOK_EVENT_REPOSITORY,
            useClass: WebhookEventRepository,
        },
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
            provide: PAYMENT_GATEWAY,
            useClass: RazorpayPaymentGatewayService,
        },
    ],
})
export class WebhooksModule { }

