import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Account } from '../../domain/entities/account.entity';
import { IPaymentGateway, PaymentResult, RefundResult, PaymentStatus, OrderResult } from '../../domain/services/payment-gateway.interface';

@Injectable()
export class MockPaymentGatewayService implements IPaymentGateway {
    private customers = new Map<string, string>(); // accountId -> gatewayCustomerId
    private payments = new Map<string, any>(); // paymentId -> payment details

    async createCustomer(account: Account): Promise<string> {
        const gatewayCustomerId = `mock_cust_${randomUUID()}`;
        this.customers.set(account.id, gatewayCustomerId);
        console.log(`[MOCK PAYMENT GATEWAY] Created customer ${gatewayCustomerId} for account "${account.companyName}"`);
        return gatewayCustomerId;
    }

    async processPayment(amount: number, customerId: string, metadata?: any): Promise<PaymentResult> {
        const paymentId = `mock_pay_${randomUUID()}`;

        // Simulate 90% success rate
        const success = Math.random() > 0.1;

        const result: PaymentResult = {
            paymentId,
            success,
            amount,
            currency: 'USD',
            status: success ? 'completed' : 'failed',
            errorMessage: success ? undefined : 'Insufficient funds (mock error)',
            gatewayResponse: {
                transactionId: paymentId,
                timestamp: new Date().toISOString(),
                mock: true,
                customerId,
                metadata,
            },
        };

        this.payments.set(paymentId, result);

        const amountInDollars = (amount / 100).toFixed(2);
        if (success) {
            console.log(`[MOCK PAYMENT GATEWAY] ✅ Payment ${paymentId}: SUCCESS - $${amountInDollars}`);
        } else {
            console.log(`[MOCK PAYMENT GATEWAY] ❌ Payment ${paymentId}: FAILED - $${amountInDollars}`);
        }

        return result;
    }

    async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
        const payment = this.payments.get(paymentId);
        if (!payment) {
            throw new Error(`Payment ${paymentId} not found`);
        }

        const refundAmount = amount || payment.amount;
        const refundInDollars = (refundAmount / 100).toFixed(2);

        console.log(`[MOCK PAYMENT GATEWAY] 💰 Refunded $${refundInDollars} for payment ${paymentId}`);

        return {
            refundId: `mock_ref_${randomUUID()}`,
            success: true,
            amount: refundAmount,
        };
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
        const payment = this.payments.get(paymentId);
        return payment?.status || 'unknown';
    }

    async createOrder(amount: number, currency: string, receipt: string, metadata?: any): Promise<OrderResult> {
        const orderId = `mock_order_${randomUUID()}`;
        console.log(`[MOCK PAYMENT GATEWAY] Created order ${orderId} for amount ${amount} ${currency}`);
        
        return {
            orderId,
            amount,
            currency,
            keyId: 'mock_key_id',
            gatewayResponse: {
                id: orderId,
                amount,
                currency,
                receipt,
                status: 'created',
                metadata,
            },
        };
    }

    verifyWebhookSignature(payload: string | object, signature: string): boolean {
        // Mock implementation - always returns true for testing
        console.log('[MOCK PAYMENT GATEWAY] Webhook signature verification (mock: always true)');
        return true;
    }
}
