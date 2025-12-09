import { randomUUID } from 'crypto';

export interface ProductVersionProps {
    id?: string;
    productId: string;
    version: number;
    name: string;
    description?: string;
    apiKey?: string;
    active?: boolean;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

/**
 * ProductVersion represents an immutable snapshot of a product
 * at a specific point in time. Used for versioning products
 * when they are linked to published plans.
 */
export class ProductVersion {
    private readonly _id: string;
    private readonly _productId: string;
    private readonly _version: number;
    private readonly _name: string;
    private readonly _description?: string;
    private readonly _apiKey?: string;
    private readonly _active: boolean;
    private readonly _metadata?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: ProductVersionProps) {
        this.validate(props);
        this._id = props.id || randomUUID();
        this._productId = props.productId;
        this._version = props.version;
        this._name = props.name;
        this._description = props.description;
        this._apiKey = props.apiKey;
        this._active = props.active ?? true;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
    }

    private validate(props: ProductVersionProps): void {
        if (!props.productId || props.productId.trim() === '') {
            throw new Error('Product ID is required');
        }

        if (!props.version || props.version < 1) {
            throw new Error('Version must be at least 1');
        }

        if (!props.name || props.name.trim() === '') {
            throw new Error('Product name is required');
        }

        if (props.name.length > 255) {
            throw new Error('Product name must be less than 255 characters');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get productId(): string {
        return this._productId;
    }

    get version(): number {
        return this._version;
    }

    get name(): string {
        return this._name;
    }

    get description(): string | undefined {
        return this._description;
    }

    get apiKey(): string | undefined {
        return this._apiKey;
    }

    get active(): boolean {
        return this._active;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    toProps(): ProductVersionProps {
        return {
            id: this._id,
            productId: this._productId,
            version: this._version,
            name: this._name,
            description: this._description,
            apiKey: this._apiKey,
            active: this._active,
            metadata: this._metadata,
            createdAt: this._createdAt,
        };
    }
}

