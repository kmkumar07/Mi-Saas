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

export interface OrderResult {
    orderId: string; // Gateway order ID (e.g., Razorpay order ID)
    amount: number;
    currency: string;
    keyId: string; // Gateway key ID for frontend (e.g., Razorpay key ID)
    gatewayResponse?: any;
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

    /**
     * Create a payment order in the gateway (for order-based flows like Razorpay)
     * @param amount - Amount in paise/cents
     * @param currency - Currency code (e.g., 'INR', 'USD')
     * @param receipt - Receipt identifier
     * @param metadata - Additional order metadata
     * @returns Order result with gateway order details
     */
    createOrder(amount: number, currency: string, receipt: string, metadata?: any): Promise<OrderResult>;

    /**
     * Verify webhook signature
     * @param payload - Webhook payload (as string or object)
     * @param signature - Signature from webhook headers
     * @returns True if signature is valid
     */
    verifyWebhookSignature(payload: string | object, signature: string): boolean;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
