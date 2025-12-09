import { Payment } from '../entities/payment.entity';

export interface PaymentTransactionData {
    paymentId: string;
    previousStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | null;
    newStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    amount?: number;
    gatewayResponse?: any;
    errorMessage?: string;
}

export interface IPaymentRepository {
    create(payment: Payment): Promise<Payment>;
    findById(id: string): Promise<Payment | null>;
    updateStatus(
        id: string,
        status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded',
        gatewayResponse?: any
    ): Promise<Payment>;
    findBySubscription(subscriptionId: string): Promise<Payment[]>;
    findByAccount(accountId: string): Promise<Payment[]>;
    createTransaction(transaction: PaymentTransactionData): Promise<void>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
