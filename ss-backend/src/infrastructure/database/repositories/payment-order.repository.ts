import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PaymentOrder } from '../../../domain/entities/payment-order.entity';
import { IPaymentOrderRepository } from '../../../domain/repositories/payment-order.repository.interface';
import { paymentOrders } from '../schema';

@Injectable()
export class PaymentOrderRepository implements IPaymentOrderRepository {
    private db: ReturnType<typeof drizzle>;

    constructor() {
        const connectionString = process.env.DATABASE_URL || '';
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async create(paymentOrder: PaymentOrder): Promise<PaymentOrder> {
        const [result] = await this.db.insert(paymentOrders).values({
            id: paymentOrder.id,
            accountId: paymentOrder.accountId,
            subscriptionId: paymentOrder.subscriptionId,
            planId: paymentOrder.planId,
            paymentId: paymentOrder.paymentId,
            razorpayOrderId: paymentOrder.razorpayOrderId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            status: paymentOrder.status,
            metadata: paymentOrder.metadata,
        }).returning();

        return this.toDomain(result);
    }

    async findById(id: string): Promise<PaymentOrder | null> {
        const [result] = await this.db
            .select()
            .from(paymentOrders)
            .where(eq(paymentOrders.id, id));

        return result ? this.toDomain(result) : null;
    }

    async findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrder | null> {
        const [result] = await this.db
            .select()
            .from(paymentOrders)
            .where(eq(paymentOrders.razorpayOrderId, razorpayOrderId));

        return result ? this.toDomain(result) : null;
    }

    async findByAccount(accountId: string): Promise<PaymentOrder[]> {
        const results = await this.db
            .select()
            .from(paymentOrders)
            .where(eq(paymentOrders.accountId, accountId));

        return results.map(r => this.toDomain(r));
    }

    async findBySubscription(subscriptionId: string): Promise<PaymentOrder[]> {
        const results = await this.db
            .select()
            .from(paymentOrders)
            .where(eq(paymentOrders.subscriptionId, subscriptionId));

        return results.map(r => this.toDomain(r));
    }

    async update(paymentOrder: PaymentOrder): Promise<PaymentOrder> {
        const [result] = await this.db
            .update(paymentOrders)
            .set({
                subscriptionId: paymentOrder.subscriptionId,
                paymentId: paymentOrder.paymentId,
                status: paymentOrder.status,
                metadata: paymentOrder.metadata,
                updatedAt: new Date(),
            })
            .where(eq(paymentOrders.id, paymentOrder.id))
            .returning();

        return this.toDomain(result);
    }

    private toDomain(data: any): PaymentOrder {
        return new PaymentOrder({
            id: data.id,
            accountId: data.accountId,
            subscriptionId: data.subscriptionId,
            planId: data.planId,
            paymentId: data.paymentId,
            razorpayOrderId: data.razorpayOrderId,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}

