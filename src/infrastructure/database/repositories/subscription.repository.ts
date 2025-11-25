import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { subscriptions } from '../schema';

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
    private db: ReturnType<typeof drizzle>;

    constructor() {
        const connectionString = process.env.DATABASE_URL || '';
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async create(subscription: Subscription): Promise<Subscription> {
        const [result] = await this.db.insert(subscriptions).values({
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
        }).returning();

        return this.toDomain(result);
    }

    async findById(id: string): Promise<Subscription | null> {
        const [result] = await this.db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id, id));

        return result ? this.toDomain(result) : null;
    }

    async findByAccountId(accountId: string): Promise<Subscription[]> {
        const results = await this.db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.accountId, accountId));

        return results.map(r => this.toDomain(r));
    }

    async findActiveByTenantAndCustomer(tenantId: string, customerId?: string): Promise<Subscription[]> {
        const conditions = [
            eq(subscriptions.tenantId, tenantId),
            eq(subscriptions.status, 'active')
        ];

        if (customerId) {
            conditions.push(eq(subscriptions.customerId, customerId));
        }

        const results = await this.db
            .select()
            .from(subscriptions)
            .where(and(...conditions));

        return results.map(r => this.toDomain(r));
    }

    async findActiveByPlanId(planId: string): Promise<Subscription[]> {
        const results = await this.db
            .select()
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.planId, planId),
                    eq(subscriptions.status, 'active')
                )
            );

        return results.map(r => this.toDomain(r));
    }

    async update(subscription: Subscription): Promise<Subscription> {
        const [result] = await this.db
            .update(subscriptions)
            .set({
                planId: subscription.planId,
                status: subscription.status,
                seats: subscription.seats,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelledAt: subscription.cancelledAt,
                cancellationReason: subscription.cancellationReason,
                metadata: subscription.metadata,
            })
            .where(eq(subscriptions.id, subscription.id))
            .returning();

        return this.toDomain(result);
    }

    async cancel(id: string, reason?: string): Promise<void> {
        await this.db
            .update(subscriptions)
            .set({
                status: 'cancelled',
                cancelledAt: new Date(),
                cancellationReason: reason,
            })
            .where(eq(subscriptions.id, id));
    }

    private toDomain(data: any): Subscription {
        return new Subscription({
            id: data.id,
            accountId: data.accountId,
            tenantId: data.tenantId,
            customerId: data.customerId,
            planId: data.planId,
            status: data.status,
            seats: data.seats,
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
            cancelledAt: data.cancelledAt,
            cancellationReason: data.cancellationReason,
            metadata: data.metadata,
            createdAt: data.createdAt,
        });
    }
}
