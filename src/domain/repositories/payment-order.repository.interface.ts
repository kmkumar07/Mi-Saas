import { PaymentOrder } from '../entities/payment-order.entity';

export interface IPaymentOrderRepository {
    create(paymentOrder: PaymentOrder): Promise<PaymentOrder>;
    findById(id: string): Promise<PaymentOrder | null>;
    findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrder | null>;
    findByAccount(accountId: string): Promise<PaymentOrder[]>;
    findBySubscription(subscriptionId: string): Promise<PaymentOrder[]>;
    update(paymentOrder: PaymentOrder): Promise<PaymentOrder>;
}

export const PAYMENT_ORDER_REPOSITORY = Symbol('PAYMENT_ORDER_REPOSITORY');

