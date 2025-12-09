import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { WebhookEvent } from '../../../domain/entities/webhook-event.entity';
import { IWebhookEventRepository } from '../../../domain/repositories/webhook-event.repository.interface';
import { webhookEvents } from '../schema';

@Injectable()
export class WebhookEventRepository implements IWebhookEventRepository {
    private db: ReturnType<typeof drizzle>;

    constructor() {
        const connectionString = process.env.DATABASE_URL || '';
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async create(webhookEvent: WebhookEvent): Promise<WebhookEvent> {
        const [result] = await this.db.insert(webhookEvents).values({
            id: webhookEvent.id,
            eventId: webhookEvent.eventId,
            eventType: webhookEvent.eventType,
            paymentOrderId: webhookEvent.paymentOrderId,
            paymentId: webhookEvent.paymentId,
            payload: webhookEvent.payload,
            signature: webhookEvent.signature,
            processed: webhookEvent.processed,
            processedAt: webhookEvent.processedAt,
            errorMessage: webhookEvent.errorMessage,
        }).returning();

        return this.toDomain(result);
    }

    async findById(id: string): Promise<WebhookEvent | null> {
        const [result] = await this.db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.id, id));

        return result ? this.toDomain(result) : null;
    }

    async findByEventId(eventId: string): Promise<WebhookEvent | null> {
        const [result] = await this.db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.eventId, eventId));

        return result ? this.toDomain(result) : null;
    }

    async findByPaymentOrder(paymentOrderId: string): Promise<WebhookEvent[]> {
        const results = await this.db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.paymentOrderId, paymentOrderId));

        return results.map(r => this.toDomain(r));
    }

    async findByPayment(paymentId: string): Promise<WebhookEvent[]> {
        const results = await this.db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.paymentId, paymentId));

        return results.map(r => this.toDomain(r));
    }

    async update(webhookEvent: WebhookEvent): Promise<WebhookEvent> {
        const [result] = await this.db
            .update(webhookEvents)
            .set({
                paymentOrderId: webhookEvent.paymentOrderId,
                paymentId: webhookEvent.paymentId,
                processed: webhookEvent.processed,
                processedAt: webhookEvent.processedAt,
                errorMessage: webhookEvent.errorMessage,
            })
            .where(eq(webhookEvents.id, webhookEvent.id))
            .returning();

        return this.toDomain(result);
    }

    async updatePaymentReferences(id: string, paymentOrderId?: string, paymentId?: string): Promise<WebhookEvent> {
        const updateData: any = {};
        if (paymentOrderId !== undefined) {
            updateData.paymentOrderId = paymentOrderId;
        }
        if (paymentId !== undefined) {
            updateData.paymentId = paymentId;
        }

        const [result] = await this.db
            .update(webhookEvents)
            .set(updateData)
            .where(eq(webhookEvents.id, id))
            .returning();

        return this.toDomain(result);
    }

    private toDomain(data: any): WebhookEvent {
        return new WebhookEvent({
            id: data.id,
            eventId: data.eventId,
            eventType: data.eventType,
            paymentOrderId: data.paymentOrderId,
            paymentId: data.paymentId,
            payload: data.payload,
            signature: data.signature,
            processed: data.processed,
            processedAt: data.processedAt,
            errorMessage: data.errorMessage,
            createdAt: data.createdAt,
        });
    }
}

