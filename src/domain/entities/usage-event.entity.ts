import { randomUUID } from 'crypto';

export interface UsageEventProps {
    id?: string;
    tenantId: string;
    customerId: string;
    subscriptionId?: string;
    featureCode: string;
    quantity?: number;
    timestamp?: Date;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
}

export class UsageEvent {
    private readonly _id: string;
    private readonly _tenantId: string;
    private readonly _customerId: string;
    private readonly _subscriptionId?: string;
    private readonly _featureCode: string;
    private readonly _quantity: number;
    private readonly _timestamp: Date;
    private readonly _metadata?: Record<string, any>;
    private readonly _idempotencyKey?: string;

    constructor(props: UsageEventProps) {
        this.validate(props);

        this._id = props.id || randomUUID();
        this._tenantId = props.tenantId;
        this._customerId = props.customerId;
        this._subscriptionId = props.subscriptionId;
        this._featureCode = props.featureCode;
        this._quantity = props.quantity || 1;
        this._timestamp = props.timestamp || new Date();
        this._metadata = props.metadata;
        this._idempotencyKey = props.idempotencyKey;
    }

    private validate(props: UsageEventProps): void {
        if (!props.tenantId || props.tenantId.trim() === '') {
            throw new Error('Tenant ID is required');
        }

        if (!props.customerId || props.customerId.trim() === '') {
            throw new Error('Customer ID is required');
        }

        if (!props.featureCode || props.featureCode.trim() === '') {
            throw new Error('Feature code is required');
        }

        // Validate feature code format (lowercase alphanumeric with underscores)
        if (!/^[a-z0-9_]+$/.test(props.featureCode)) {
            throw new Error('Feature code must be lowercase alphanumeric with underscores only');
        }

        if (props.quantity !== undefined && props.quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get tenantId(): string {
        return this._tenantId;
    }

    get customerId(): string {
        return this._customerId;
    }

    get subscriptionId(): string | undefined {
        return this._subscriptionId;
    }

    get featureCode(): string {
        return this._featureCode;
    }

    get quantity(): number {
        return this._quantity;
    }

    get timestamp(): Date {
        return this._timestamp;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }

    get idempotencyKey(): string | undefined {
        return this._idempotencyKey;
    }
}
