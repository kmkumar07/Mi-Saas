import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Payment } from '../../../domain/entities/payment.entity';
import { IPaymentRepository, PaymentTransactionData } from '../../../domain/repositories/payment.repository';
import { payments, paymentTransactions } from '../schema';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
    private db: ReturnType<typeof drizzle>;

    constructor() {
        const connectionString = process.env.DATABASE_URL || '';
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async create(payment: Payment): Promise<Payment> {
        const [result] = await this.db.insert(payments).values({
            id: payment.id,
            accountId: payment.accountId,
            subscriptionId: payment.subscriptionId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            gatewayPaymentId: payment.gatewayPaymentId,
            gatewayCustomerId: payment.gatewayCustomerId,
            paymentMethod: payment.paymentMethod,
            paymentType: payment.paymentType,
            description: payment.description,
            refundedAmount: payment.refundedAmount,
            metadata: payment.metadata,
        }).returning();

        // Log initial transaction
        await this.createTransaction({
            paymentId: result.id,
            previousStatus: null,
            newStatus: result.status as any,
            amount: result.amount,
        });

        return this.toDomain(result);
    }

    async findById(id: string): Promise<Payment | null> {
        const [result] = await this.db
            .select()
            .from(payments)
            .where(eq(payments.id, id));

        return result ? this.toDomain(result) : null;
    }

    async updateStatus(
        id: string,
        status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded',
        gatewayResponse?: any
    ): Promise<Payment> {
        // Get current payment
        const current = await this.findById(id);
        if (!current) {
            throw new Error(`Payment ${id} not found`);
        }

        // Update payment
        const [result] = await this.db
            .update(payments)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(payments.id, id))
            .returning();

        // Log transaction
        await this.createTransaction({
            paymentId: id,
            previousStatus: current.status,
            newStatus: status,
            gatewayResponse,
        });

        return this.toDomain(result);
    }

    async findBySubscription(subscriptionId: string): Promise<Payment[]> {
        const results = await this.db
            .select()
            .from(payments)
            .where(eq(payments.subscriptionId, subscriptionId));

        return results.map(r => this.toDomain(r));
    }

    async findByAccount(accountId: string): Promise<Payment[]> {
        const results = await this.db
            .select()
            .from(payments)
            .where(eq(payments.accountId, accountId));

        return results.map(r => this.toDomain(r));
    }

    async createTransaction(transaction: PaymentTransactionData): Promise<void> {
        await this.db.insert(paymentTransactions).values({
            paymentId: transaction.paymentId,
            previousStatus: transaction.previousStatus,
            newStatus: transaction.newStatus,
            amount: transaction.amount,
            gatewayResponse: transaction.gatewayResponse,
            errorMessage: transaction.errorMessage,
        });
    }

    private toDomain(data: any): Payment {
        return new Payment({
            id: data.id,
            accountId: data.accountId,
            subscriptionId: data.subscriptionId,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            gatewayPaymentId: data.gatewayPaymentId,
            gatewayCustomerId: data.gatewayCustomerId,
            paymentMethod: data.paymentMethod,
            paymentType: data.paymentType,
            description: data.description,
            refundedAmount: data.refundedAmount,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
