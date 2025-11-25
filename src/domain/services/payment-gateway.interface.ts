import { Account } from '../entities/account.entity';

export interface PaymentResult {
    paymentId: string;
    success: boolean;
    amount: number;
    currency: string;
    status: 'completed' | 'failed';
    errorMessage?: string;
    gatewayResponse?: any;
}

export interface RefundResult {
    refundId: string;
    success: boolean;
    amount: number;
    errorMessage?: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'unknown';

/**
 * Payment Gateway Interface
 * 
 * Abstraction for payment processing providers (Stripe, PayPal, etc.)
 * Allows easy switching between payment providers
 */
export interface IPaymentGateway {
    /**
     * Create a customer in the payment gateway
     * @param account - The billing account
     * @returns Gateway customer ID
     */
    createCustomer(account: Account): Promise<string>;

    /**
     * Process a payment
     * @param amount - Amount in cents
     * @param customerId - Gateway customer ID
     * @param metadata - Additional payment metadata
     * @returns Payment result with gateway response
     */
    processPayment(amount: number, customerId: string, metadata?: any): Promise<PaymentResult>;

    /**
     * Refund a payment
     * @param paymentId - Gateway payment ID
     * @param amount - Amount to refund in cents (optional, defaults to full amount)
     * @returns Refund result
     */
    refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;

    /**
     * Get payment status from gateway
     * @param paymentId - Gateway payment ID
     * @returns Current payment status
     */
    getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
