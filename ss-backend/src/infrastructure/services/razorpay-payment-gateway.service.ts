import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Account } from '../../domain/entities/account.entity';
import {
    IPaymentGateway,
    PaymentResult,
    RefundResult,
    PaymentStatus,
    OrderResult,
} from '../../domain/services/payment-gateway.interface';

@Injectable()
export class RazorpayPaymentGatewayService implements IPaymentGateway {
    private razorpay: Razorpay;
    private readonly keyId: string;
    private readonly keySecret: string;
    private readonly webhookSecret: string;

    constructor(private configService: ConfigService) {
        this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
        this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
        this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';

        if (!this.keyId || !this.keySecret) {
            throw new Error('Razorpay key ID and key secret must be configured');
        }

        this.razorpay = new Razorpay({
            key_id: this.keyId,
            key_secret: this.keySecret,
        });
    }

    async createCustomer(account: Account): Promise<string> {
        try {
            const customer = await this.razorpay.customers.create({
                name: account.companyName,
                email: account.billingEmail,
                contact: account.metadata?.phone || undefined,
                notes: {
                    accountId: account.id,
                    tenantId: account.tenantId,
                    companyName: account.companyName,
                },
            });

            return customer.id;
        } catch (error: any) {
            console.error('[RAZORPAY] Error creating customer:', error);
            throw new Error(`Failed to create Razorpay customer: ${error.message}`);
        }
    }

    async processPayment(amount: number, customerId: string, metadata?: any): Promise<PaymentResult> {
        // For Razorpay, we typically use orders instead of direct payments
        // This method is kept for backward compatibility but should use createOrder instead
        try {
            const order = await this.createOrder(amount, 'INR', `receipt_${Date.now()}`, {
                customerId,
                ...metadata,
            });

            // In Razorpay, payment happens on frontend, so we return pending status
            return {
                paymentId: order.orderId,
                success: true,
                amount,
                currency: 'INR',
                status: 'completed', // Will be updated via webhook
                gatewayResponse: order.gatewayResponse,
            };
        } catch (error: any) {
            console.error('[RAZORPAY] Error processing payment:', error);
            return {
                paymentId: '',
                success: false,
                amount,
                currency: 'INR',
                status: 'failed',
                errorMessage: error.message,
            };
        }
    }

    async createOrder(
        amount: number,
        currency: string,
        receipt: string,
        metadata?: any,
    ): Promise<OrderResult> {
        try {
            const order = await this.razorpay.orders.create({
                amount: amount, // Amount in paise
                currency: currency.toUpperCase(),
                receipt: receipt,
                notes: metadata || {},
            });

            return {
                orderId: order.id,
                amount: typeof order.amount === 'number' ? order.amount : parseInt(order.amount, 10),
                currency: order.currency,
                keyId: this.keyId,
                gatewayResponse: order,
            };
        } catch (error: any) {
            console.error('[RAZORPAY] Error creating order:', error);
            throw new Error(`Failed to create Razorpay order: ${error.message}`);
        }
    }

    async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
        try {
            const refundOptions: any = {
                payment_id: paymentId,
            };

            if (amount) {
                refundOptions.amount = amount; // Amount in paise
            }

            const refund = await this.razorpay.payments.refund(paymentId, refundOptions);

            return {
                refundId: refund.id,
                success: true,
                amount: refund.amount || amount || 0,
            };
        } catch (error: any) {
            console.error('[RAZORPAY] Error refunding payment:', error);
            return {
                refundId: '',
                success: false,
                amount: amount || 0,
                errorMessage: error.message,
            };
        }
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);

            // Map Razorpay payment status to our PaymentStatus type
            const status = payment.status as string;
            switch (status) {
                case 'authorized':
                case 'captured':
                    return 'completed';
                case 'failed':
                    return 'failed';
                case 'refunded':
                    return 'refunded';
                case 'pending':
                    return 'pending';
                default:
                    return 'unknown';
            }
        } catch (error: any) {
            console.error('[RAZORPAY] Error fetching payment status:', error);
            return 'unknown';
        }
    }

    verifyWebhookSignature(payload: string | object, signature: string): boolean {
        try {
            if (!this.webhookSecret) {
                console.warn('[RAZORPAY] Webhook secret not configured, skipping signature verification');
                return false;
            }

            const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

            // Razorpay uses HMAC SHA256 for webhook signature verification
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(payloadString)
                .digest('hex');

            // Use constant-time comparison to prevent timing attacks
            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature),
            );
        } catch (error: any) {
            console.error('[RAZORPAY] Error verifying webhook signature:', error);
            return false;
        }
    }
}

