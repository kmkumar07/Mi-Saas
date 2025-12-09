import { randomUUID } from 'crypto';

export interface WebhookEventProps {
    id?: string;
    eventId: string; // Razorpay event ID for idempotency
    eventType: string; // payment.captured, payment.failed, etc.
    paymentOrderId?: string;
    paymentId?: string;
    payload: Record<string, any>; // Full webhook payload
    signature?: string;
    processed?: boolean;
    processedAt?: Date;
    errorMessage?: string;
    createdAt?: Date;
}

export class WebhookEvent {
    private readonly _id: string;
    private readonly _eventId: string;
    private readonly _eventType: string;
    private readonly _paymentOrderId?: string;
    private readonly _paymentId?: string;
    private readonly _payload: Record<string, any>;
    private readonly _signature?: string;
    private _processed: boolean;
    private _processedAt?: Date;
    private _errorMessage?: string;
    private readonly _createdAt: Date;

    constructor(props: WebhookEventProps) {
        this.validate(props);

        this._id = props.id || randomUUID();
        this._eventId = props.eventId;
        this._eventType = props.eventType;
        this._paymentOrderId = props.paymentOrderId;
        this._paymentId = props.paymentId;
        this._payload = props.payload;
        this._signature = props.signature;
        this._processed = props.processed || false;
        this._processedAt = props.processedAt;
        this._errorMessage = props.errorMessage;
        this._createdAt = props.createdAt || new Date();
    }

    private validate(props: WebhookEventProps): void {
        if (!props.eventId || props.eventId.trim() === '') {
            throw new Error('Event ID is required');
        }

        if (!props.eventType || props.eventType.trim() === '') {
            throw new Error('Event type is required');
        }

        if (!props.payload || typeof props.payload !== 'object') {
            throw new Error('Payload is required and must be an object');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get eventId(): string {
        return this._eventId;
    }

    get eventType(): string {
        return this._eventType;
    }

    get paymentOrderId(): string | undefined {
        return this._paymentOrderId;
    }

    get paymentId(): string | undefined {
        return this._paymentId;
    }

    get payload(): Record<string, any> {
        return this._payload;
    }

    get signature(): string | undefined {
        return this._signature;
    }

    get processed(): boolean {
        return this._processed;
    }

    get processedAt(): Date | undefined {
        return this._processedAt;
    }

    get errorMessage(): string | undefined {
        return this._errorMessage;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    // Business methods
    markAsProcessed(): void {
        if (this._processed) {
            throw new Error('Webhook event is already processed');
        }
        this._processed = true;
        this._processedAt = new Date();
    }

    markAsFailed(errorMessage: string): void {
        if (this._processed) {
            throw new Error('Cannot mark processed event as failed');
        }
        this._errorMessage = errorMessage;
    }

    isProcessed(): boolean {
        return this._processed;
    }

    isPaymentCaptured(): boolean {
        return this._eventType === 'payment.captured';
    }

    isPaymentFailed(): boolean {
        return this._eventType === 'payment.failed';
    }

    isOrderPaid(): boolean {
        return this._eventType === 'order.paid';
    }
}

