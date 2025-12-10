import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { UsageEvent } from '../../../domain/entities/usage-event.entity';
import { IUsageEventRepository, AggregatedUsage } from '../../../domain/repositories/usage-event.repository';
import { usageEvents } from '../schema';

@Injectable()
export class UsageEventRepository implements IUsageEventRepository {
    private db: ReturnType<typeof drizzle>;

    constructor() {
        const connectionString = process.env.DATABASE_URL || '';
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async create(event: UsageEvent): Promise<UsageEvent> {
        // Check for idempotency
        if (event.idempotencyKey) {
            const existing = await this.findByIdempotencyKey(event.idempotencyKey);
            if (existing) {
                return existing;
            }
        }

        const [result] = await this.db.insert(usageEvents).values({
            id: event.id,
            tenantId: event.tenantId,
            customerId: event.customerId,
            subscriptionId: event.subscriptionId,
            featureCode: event.featureCode,
            quantity: event.quantity,
            timestamp: event.timestamp,
            metadata: event.metadata,
            idempotencyKey: event.idempotencyKey,
        }).returning();

        return this.toDomain(result);
    }

    async findBySubscription(subscriptionId: string, startDate?: Date, endDate?: Date): Promise<UsageEvent[]> {
        const conditions = [eq(usageEvents.subscriptionId, subscriptionId)];

        if (startDate) {
            conditions.push(gte(usageEvents.timestamp, startDate));
        }
        if (endDate) {
            conditions.push(lte(usageEvents.timestamp, endDate));
        }

        const results = await this.db
            .select()
            .from(usageEvents)
            .where(and(...conditions));

        return results.map(r => this.toDomain(r));
    }

    async getAggregatedUsage(
        tenantId: string,
        customerId?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<AggregatedUsage[]> {
        const conditions = [
            eq(usageEvents.tenantId, tenantId),
        ];

        if (customerId) {
            conditions.push(eq(usageEvents.customerId, customerId));
        }

        if (startDate) {
            conditions.push(gte(usageEvents.timestamp, startDate));
        }
        if (endDate) {
            conditions.push(lte(usageEvents.timestamp, endDate));
        }

        const results = await this.db
            .select({
                featureCode: usageEvents.featureCode,
                totalQuantity: sql<number>`sum(${usageEvents.quantity})::int`,
            })
            .from(usageEvents)
            .where(and(...conditions))
            .groupBy(usageEvents.featureCode);

        return results.map(r => ({
            featureCode: r.featureCode,
            totalQuantity: r.totalQuantity,
        }));
    }

    async findByIdempotencyKey(idempotencyKey: string): Promise<UsageEvent | null> {
        const [result] = await this.db
            .select()
            .from(usageEvents)
            .where(eq(usageEvents.idempotencyKey, idempotencyKey));

        return result ? this.toDomain(result) : null;
    }

    private toDomain(data: any): UsageEvent {
        return new UsageEvent({
            id: data.id,
            tenantId: data.tenantId,
            customerId: data.customerId,
            subscriptionId: data.subscriptionId,
            featureCode: data.featureCode,
            quantity: data.quantity,
            timestamp: data.timestamp,
            metadata: data.metadata,
            idempotencyKey: data.idempotencyKey,
        });
    }
}
