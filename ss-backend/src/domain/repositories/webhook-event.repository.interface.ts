import { WebhookEvent } from '../entities/webhook-event.entity';

export interface IWebhookEventRepository {
    create(webhookEvent: WebhookEvent): Promise<WebhookEvent>;
    findById(id: string): Promise<WebhookEvent | null>;
    findByEventId(eventId: string): Promise<WebhookEvent | null>;
    findByPaymentOrder(paymentOrderId: string): Promise<WebhookEvent[]>;
    findByPayment(paymentId: string): Promise<WebhookEvent[]>;
    update(webhookEvent: WebhookEvent): Promise<WebhookEvent>;
    updatePaymentReferences(id: string, paymentOrderId?: string, paymentId?: string): Promise<WebhookEvent>;
}

export const WEBHOOK_EVENT_REPOSITORY = Symbol('WEBHOOK_EVENT_REPOSITORY');

