import { randomUUID } from 'crypto';
import { PlanType } from '../enums';
import { Price, RenewalDefinition, TimePeriod } from '../value-objects';

export interface PlanProps {
    id?: string;
    tenantId: string;
    name: string;
    planType: PlanType;
    productIds: string[]; // Array of product IDs associated with this plan
    price: Price;
    renewalDefinition?: RenewalDefinition;
    trialPeriod?: TimePeriod;
    active?: boolean;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

export class Plan {
    private readonly _id: string;
    private readonly _tenantId: string;
    private _name: string;
    private _planType: PlanType;
    private _productIds: string[];
    private _price: Price;
    private _renewalDefinition?: RenewalDefinition;
    private _trialPeriod?: TimePeriod;
    private _active: boolean;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: PlanProps) {
        this.validate(props);
        this._id = props.id || randomUUID(); // Generate UUID if not provided
        this._tenantId = props.tenantId;
        this._name = props.name;
        this._planType = props.planType;
        this._productIds = props.productIds;
        this._price = props.price;
        this._renewalDefinition = props.renewalDefinition;
        this._trialPeriod = props.trialPeriod;
        this._active = props.active ?? true;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
    }

    private validate(props: PlanProps): void {
        if (!props.tenantId || props.tenantId.trim() === '') {
            throw new Error('Tenant ID is required');
        }

        if (!props.name || props.name.trim() === '') {
            throw new Error('Plan name is required');
        }

        if (props.name.length > 255) {
            throw new Error('Plan name must be less than 255 characters');
        }

        if (!props.productIds || props.productIds.length === 0) {
            throw new Error('At least one product is required');
        }

        if (!props.price) {
            throw new Error('Price is required');
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

    get planType(): PlanType {
        return this._planType;
    }

    get productIds(): string[] {
        return [...this._productIds];
    }

    get price(): Price {
        return this._price;
    }

    get renewalDefinition(): RenewalDefinition | undefined {
        return this._renewalDefinition;
    }

    get trialPeriod(): TimePeriod | undefined {
        return this._trialPeriod;
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
    updatePrice(newPrice: Price): void {
        this._price = newPrice;
    }

    updateName(newName: string): void {
        if (!newName || newName.trim() === '') {
            throw new Error('Plan name cannot be empty');
        }
        this._name = newName;
    }

    activate(): void {
        this._active = true;
    }

    deactivate(): void {
        this._active = false;
    }

    updatePlanType(type: PlanType): void {
        this._planType = type;
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
    }

    addProduct(productId: string): void {
        if (!this._productIds.includes(productId)) {
            this._productIds.push(productId);
        }
    }

    removeProduct(productId: string): void {
        this._productIds = this._productIds.filter(id => id !== productId);
        if (this._productIds.length === 0) {
            throw new Error('Plan must have at least one product');
        }
    }

    updateRenewalDefinition(renewalDefinition: RenewalDefinition): void {
        this._renewalDefinition = renewalDefinition;
    }

    updateTrialPeriod(trialPeriod: TimePeriod): void {
        this._trialPeriod = trialPeriod;
    }

    hasTrialPeriod(): boolean {
        return this._trialPeriod !== undefined;
    }

    hasRenewalDefinition(): boolean {
        return this._renewalDefinition !== undefined;
    }
}
