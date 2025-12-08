import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IPaymentOrderRepository, PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { IWebhookEventRepository, WEBHOOK_EVENT_REPOSITORY } from '@domain/repositories/webhook-event.repository.interface';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { WebhookEvent } from '@domain/entities/webhook-event.entity';
import { Payment } from '@domain/entities/payment.entity';
import { WebhookEventDto } from '@application/dtos/webhook-event.dto';

@Injectable()
export class ProcessWebhookUseCase {
    constructor(
        @Inject(WEBHOOK_EVENT_REPOSITORY)
        private readonly webhookEventRepository: IWebhookEventRepository,
        @Inject(PAYMENT_ORDER_REPOSITORY)
        private readonly paymentOrderRepository: IPaymentOrderRepository,
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(payload: WebhookEventDto, signature: string, rawBody?: string): Promise<void> {
        // Verify webhook signature using raw body if available, otherwise use payload object
        const bodyForVerification = rawBody || payload;
        const isValid = this.paymentGateway.verifyWebhookSignature(bodyForVerification, signature);
        if (!isValid) {
            throw new BadRequestException('Invalid webhook signature');
        }

        // Check for idempotency - use Razorpay event ID
        const eventId = payload.entity || `${payload.event}_${payload.created_at}`;
        const existingEvent = await this.webhookEventRepository.findByEventId(eventId);
        
        if (existingEvent && existingEvent.isProcessed()) {
            // Already processed, skip
            return;
        }

        // Create webhook event record
        const webhookEvent = new WebhookEvent({
            eventId,
            eventType: payload.event,
            payload: payload as any,
            signature,
        });

        const createdEvent = await this.webhookEventRepository.create(webhookEvent);

        try {
            // Process based on event type
            if (payload.event === 'payment.captured') {
                await this.handlePaymentCaptured(payload, createdEvent);
            } else if (payload.event === 'payment.failed') {
                await this.handlePaymentFailed(payload, createdEvent);
            } else if (payload.event === 'order.paid') {
                await this.handleOrderPaid(payload, createdEvent);
            }

            // Mark event as processed
            createdEvent.markAsProcessed();
            await this.webhookEventRepository.update(createdEvent);
        } catch (error: any) {
            // Mark event as failed
            createdEvent.markAsFailed(error.message);
            await this.webhookEventRepository.update(createdEvent);
            throw error;
        }
    }

    private async handlePaymentCaptured(payload: WebhookEventDto, webhookEvent: WebhookEvent): Promise<void> {
        const paymentEntity = payload.payload?.payment?.entity;
        if (!paymentEntity) {
            throw new BadRequestException('Payment entity not found in webhook payload');
        }

        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        // Find payment order
        const paymentOrder = await this.paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (!paymentOrder) {
            throw new NotFoundException(`Payment order with Razorpay order ID ${razorpayOrderId} not found`);
        }

        // Update webhook event with payment order reference
        await this.webhookEventRepository.updatePaymentReferences(webhookEvent.id, paymentOrder.id);

        // Create or update payment record
        let payment: Payment | null = null;
        if (paymentOrder.paymentId) {
            payment = await this.paymentRepository.findById(paymentOrder.paymentId);
            if (!payment) {
                throw new NotFoundException(`Payment ${paymentOrder.paymentId} not found`);
            }
            await this.paymentRepository.updateStatus(payment.id, 'completed', paymentEntity);
        } else {
            // Create new payment record
            payment = new Payment({
                accountId: paymentOrder.accountId,
                subscriptionId: paymentOrder.subscriptionId,
                amount: paymentEntity.amount,
                currency: paymentEntity.currency,
                status: 'completed',
                gatewayPaymentId: razorpayPaymentId,
                gatewayCustomerId: paymentEntity.customer_id,
                paymentMethod: paymentEntity.method || 'card',
                paymentType: 'subscription',
                description: `Payment for order ${razorpayOrderId}`,
                metadata: {
                    razorpayOrderId,
                    razorpayPaymentId,
                    paymentEntity,
                },
            });

            payment = await this.paymentRepository.create(payment);
        }

        // Update webhook event with payment reference
        await this.webhookEventRepository.updatePaymentReferences(webhookEvent.id, undefined, payment.id);

        // Mark payment order as paid
        if (!paymentOrder.isPaid()) {
            paymentOrder.markAsPaid(payment.id);
            await this.paymentOrderRepository.update(paymentOrder);
        }

        // Activate subscription
        if (paymentOrder.subscriptionId) {
            const subscription = await this.subscriptionRepository.findById(paymentOrder.subscriptionId);
            if (subscription && subscription.status === 'incomplete') {
                subscription.activate();
                await this.subscriptionRepository.update(subscription);
            }
        }

        await this.webhookEventRepository.update(webhookEvent);
    }

    private async handlePaymentFailed(payload: WebhookEventDto, webhookEvent: WebhookEvent): Promise<void> {
        const paymentEntity = payload.payload?.payment?.entity;
        if (!paymentEntity) {
            throw new BadRequestException('Payment entity not found in webhook payload');
        }

        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        // Find payment order
        const paymentOrder = await this.paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (!paymentOrder) {
            throw new NotFoundException(`Payment order with Razorpay order ID ${razorpayOrderId} not found`);
        }

        // Update webhook event with payment order reference
        await this.webhookEventRepository.updatePaymentReferences(webhookEvent.id, paymentOrder.id);

        // Create payment record with failed status
        const payment = new Payment({
            accountId: paymentOrder.accountId,
            subscriptionId: paymentOrder.subscriptionId,
            amount: paymentEntity.amount,
            currency: paymentEntity.currency,
            status: 'failed',
            gatewayPaymentId: razorpayPaymentId,
            gatewayCustomerId: paymentEntity.customer_id,
            paymentMethod: paymentEntity.method || 'card',
            paymentType: 'subscription',
            description: `Failed payment for order ${razorpayOrderId}`,
            metadata: {
                razorpayOrderId,
                razorpayPaymentId,
                paymentEntity,
                error: paymentEntity.error_description || 'Payment failed',
            },
        });

        const createdPayment = await this.paymentRepository.create(payment);

        // Mark payment order as failed
        if (!paymentOrder.isFailed()) {
            paymentOrder.markAsFailed();
            await this.paymentOrderRepository.update(paymentOrder);
        }

        // Update webhook event with payment reference
        await this.webhookEventRepository.updatePaymentReferences(webhookEvent.id, undefined, createdPayment.id);

        // Note: Webhook processing succeeded (we received and processed the failed payment event)
        // The payment itself is marked as failed, but the webhook event is processed successfully
    }

    private async handleOrderPaid(payload: WebhookEventDto, webhookEvent: WebhookEvent): Promise<void> {
        const orderEntity = payload.payload?.order?.entity;
        if (!orderEntity) {
            throw new BadRequestException('Order entity not found in webhook payload');
        }

        const razorpayOrderId = orderEntity.id;

        // Find payment order
        const paymentOrder = await this.paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (!paymentOrder) {
            throw new NotFoundException(`Payment order with Razorpay order ID ${razorpayOrderId} not found`);
        }

        // Update webhook event with payment order reference
        await this.webhookEventRepository.updatePaymentReferences(webhookEvent.id, paymentOrder.id);

        // Mark payment order as paid (if not already)
        if (!paymentOrder.isPaid()) {
            paymentOrder.markAsAttempted();
            await this.paymentOrderRepository.update(paymentOrder);
        }

        await this.webhookEventRepository.update(webhookEvent);
    }
}

