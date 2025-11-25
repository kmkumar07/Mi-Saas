import { randomUUID } from 'crypto';

export interface PaymentProps {
    id?: string;
    accountId: string;
    subscriptionId?: string;
    amount: number; // in cents
    currency?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    gatewayPaymentId?: string;
    gatewayCustomerId?: string;
    paymentMethod?: string;
    paymentType: 'subscription' | 'upgrade' | 'addon';
    description?: string;
    refundedAmount?: number;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Payment {
    private readonly _id: string;
    private readonly _accountId: string;
    private readonly _subscriptionId?: string;
    private readonly _amount: number;
    private readonly _currency: string;
    private _status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    private _gatewayPaymentId?: string;
    private readonly _gatewayCustomerId?: string;
    private readonly _paymentMethod?: string;
    private readonly _paymentType: 'subscription' | 'upgrade' | 'addon';
    private readonly _description?: string;
    private _refundedAmount: number;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    constructor(props: PaymentProps) {
        this.validate(props);

        this._id = props.id || randomUUID();
        this._accountId = props.accountId;
        this._subscriptionId = props.subscriptionId;
        this._amount = props.amount;
        this._currency = props.currency || 'USD';
        this._status = props.status || 'pending';
        this._gatewayPaymentId = props.gatewayPaymentId;
        this._gatewayCustomerId = props.gatewayCustomerId;
        this._paymentMethod = props.paymentMethod;
        this._paymentType = props.paymentType;
        this._description = props.description;
        this._refundedAmount = props.refundedAmount || 0;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }

    private validate(props: PaymentProps): void {
        if (!props.accountId || props.accountId.trim() === '') {
            throw new Error('Account ID is required');
        }

        if (props.amount <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        if (!props.paymentType) {
            throw new Error('Payment type is required');
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

    get amount(): number {
        return this._amount;
    }

    get currency(): string {
        return this._currency;
    }

    get status(): 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' {
        return this._status;
    }

    get gatewayPaymentId(): string | undefined {
        return this._gatewayPaymentId;
    }

    get gatewayCustomerId(): string | undefined {
        return this._gatewayCustomerId;
    }

    get paymentMethod(): string | undefined {
        return this._paymentMethod;
    }

    get paymentType(): 'subscription' | 'upgrade' | 'addon' {
        return this._paymentType;
    }

    get description(): string | undefined {
        return this._description;
    }

    get refundedAmount(): number {
        return this._refundedAmount;
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
    process(gatewayPaymentId: string): void {
        if (this._status !== 'pending') {
            throw new Error('Can only process pending payments');
        }
        this._status = 'processing';
        this._gatewayPaymentId = gatewayPaymentId;
        this._updatedAt = new Date();
    }

    complete(): void {
        if (this._status !== 'processing' && this._status !== 'pending') {
            throw new Error('Can only complete processing or pending payments');
        }
        this._status = 'completed';
        this._updatedAt = new Date();
    }

    fail(): void {
        if (this._status === 'completed' || this._status === 'refunded') {
            throw new Error('Cannot fail a completed or refunded payment');
        }
        this._status = 'failed';
        this._updatedAt = new Date();
    }

    refund(amount?: number): void {
        if (this._status !== 'completed') {
            throw new Error('Can only refund completed payments');
        }

        const refundAmount = amount || this._amount;

        if (refundAmount <= 0) {
            throw new Error('Refund amount must be greater than 0');
        }

        if (this._refundedAmount + refundAmount > this._amount) {
            throw new Error('Refund amount exceeds payment amount');
        }

        this._refundedAmount += refundAmount;

        if (this._refundedAmount === this._amount) {
            this._status = 'refunded';
        } else {
            this._status = 'partially_refunded';
        }

        this._updatedAt = new Date();
    }

    isCompleted(): boolean {
        return this._status === 'completed';
    }

    isFailed(): boolean {
        return this._status === 'failed';
    }

    isRefunded(): boolean {
        return this._status === 'refunded' || this._status === 'partially_refunded';
    }

    canBeRefunded(): boolean {
        return this._status === 'completed' && this._refundedAmount < this._amount;
    }
}
