import { randomUUID } from 'crypto';

export interface ProductProps {
    id?: string;
    tenantId: string;
    name: string;
    description?: string;
    apiKey?: string;
    active?: boolean;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

export class Product {
    private readonly _id: string;
    private readonly _tenantId: string;
    private _name: string;
    private _description?: string;
    private _apiKey?: string;
    private _active: boolean;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: ProductProps) {
        this.validate(props);
        this._id = props.id || randomUUID(); // Generate UUID if not provided
        this._tenantId = props.tenantId;
        this._name = props.name;
        this._description = props.description;
        this._apiKey = props.apiKey;
        this._active = props.active ?? true;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
    }

    private validate(props: ProductProps): void {
        if (!props.tenantId || props.tenantId.trim() === '') {
            throw new Error('Tenant ID is required');
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

    get tenantId(): string {
        return this._tenantId;
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

    // Business methods
    updateName(newName: string): void {
        if (!newName || newName.trim() === '') {
            throw new Error('Product name cannot be empty');
        }
        this._name = newName;
    }

    updateDescription(description: string): void {
        this._description = description;
    }

    activate(): void {
        this._active = true;
    }

    deactivate(): void {
        this._active = false;
    }

    setApiKey(apiKey: string): void {
        this._apiKey = apiKey;
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
    }
}
