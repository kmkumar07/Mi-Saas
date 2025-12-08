import { randomUUID } from 'crypto';

export interface PaymentOrderProps {
    id?: string;
    accountId: string;
    subscriptionId?: string;
    planId: string;
    paymentId?: string;
    razorpayOrderId: string;
    amount: number; // in paise/cents
    currency?: string;
    status?: 'pending' | 'created' | 'attempted' | 'paid' | 'failed';
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class PaymentOrder {
    private readonly _id: string;
    private readonly _accountId: string;
    private _subscriptionId?: string;
    private readonly _planId: string;
    private _paymentId?: string;
    private readonly _razorpayOrderId: string;
    private readonly _amount: number;
    private readonly _currency: string;
    private _status: 'pending' | 'created' | 'attempted' | 'paid' | 'failed';
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    constructor(props: PaymentOrderProps) {
        this.validate(props);

        this._id = props.id || randomUUID();
        this._accountId = props.accountId;
        this._subscriptionId = props.subscriptionId;
        this._planId = props.planId;
        this._paymentId = props.paymentId;
        this._razorpayOrderId = props.razorpayOrderId;
        this._amount = props.amount;
        this._currency = props.currency || 'INR';
        this._status = props.status || 'pending';
        this._metadata = props.metadata;
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }

    private validate(props: PaymentOrderProps): void {
        if (!props.accountId || props.accountId.trim() === '') {
            throw new Error('Account ID is required');
        }

        if (!props.planId || props.planId.trim() === '') {
            throw new Error('Plan ID is required');
        }

        if (!props.razorpayOrderId || props.razorpayOrderId.trim() === '') {
            throw new Error('Razorpay order ID is required');
        }

        if (props.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get accountId(): string {
        return this._accountId;
    }

    get subscriptionId(): string | undefined {
        return this._subscriptionId;
    }

    get planId(): string {
        return this._planId;
    }

    get paymentId(): string | undefined {
        return this._paymentId;
    }

    get razorpayOrderId(): string {
        return this._razorpayOrderId;
    }

    get amount(): number {
        return this._amount;
    }

    get currency(): string {
        return this._currency;
    }

    get status(): 'pending' | 'created' | 'attempted' | 'paid' | 'failed' {
        return this._status;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    // Business methods
    markAsCreated(): void {
        this._status = 'created';
        this._updatedAt = new Date();
    }

    markAsAttempted(): void {
        if (this._status !== 'created' && this._status !== 'pending') {
            throw new Error('Can only mark attempted from created or pending status');
        }
        this._status = 'attempted';
        this._updatedAt = new Date();
    }

    markAsPaid(paymentId: string): void {
        if (this._status === 'paid') {
            throw new Error('Order is already marked as paid');
        }
        this._status = 'paid';
        this._paymentId = paymentId;
        this._updatedAt = new Date();
    }

    markAsFailed(): void {
        if (this._status === 'paid') {
            throw new Error('Cannot mark paid order as failed');
        }
        this._status = 'failed';
        this._updatedAt = new Date();
    }

    linkSubscription(subscriptionId: string): void {
        this._subscriptionId = subscriptionId;
        this._updatedAt = new Date();
    }

    linkPayment(paymentId: string): void {
        this._paymentId = paymentId;
        this._updatedAt = new Date();
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
        this._updatedAt = new Date();
    }

    isPaid(): boolean {
        return this._status === 'paid';
    }

    isFailed(): boolean {
        return this._status === 'failed';
    }

    canBePaid(): boolean {
        return this._status === 'created' || this._status === 'attempted' || this._status === 'pending';
    }
}

