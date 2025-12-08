import { randomUUID } from 'crypto';
import { PlanType } from '../enums';
import { Price, RenewalDefinition, TimePeriod } from '../value-objects';

export interface PlanProps {
    id?: string;
    planFamilyId?: string; // Foreign key to plan_families table
    name: string;
    planCode?: string; // Denormalized from plan family for fast lookups
    planType: PlanType;
    productIds: string[]; // Array of product IDs associated with this plan
    price: Price;
    renewalDefinition?: RenewalDefinition;
    trialPeriod?: TimePeriod;
    active?: boolean;
    status?: 'active' | 'archived' | 'draft' | 'published';
    metadata?: Record<string, any>;
    createdAt?: Date;
    /**
     * Explicit version number for the plan within its family.
     * Starts at 1 for the initial version and increments for each new version.
     */
    version?: number;
}

export class Plan {
    private readonly _id: string;
    private _planFamilyId?: string;
    private _name: string;
    private _planCode: string;
    private _planType: PlanType;
    private _productIds: string[];
    private _price: Price;
    private _renewalDefinition?: RenewalDefinition;
    private _trialPeriod?: TimePeriod;
    private _active: boolean;
    private _status: 'active' | 'archived' | 'draft' | 'published';
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;
    private readonly _version: number;

    constructor(props: PlanProps) {
        this.validate(props);
        this._id = props.id || randomUUID();
        this._planFamilyId = props.planFamilyId;
        this._name = props.name;
        // If planFamilyId is provided but planCode is not, it should be set from family
        // For now, generate from name if not provided (will be synced from family during persistence)
        this._planCode = props.planCode || this.generatePlanCode(props.name);
        this._planType = props.planType;
        this._productIds = props.productIds;
        this._price = props.price;
        this._renewalDefinition = props.renewalDefinition;
        this._trialPeriod = props.trialPeriod;
        this._active = props.active ?? true;
        this._status = props.status || 'draft'; // Default to draft for new plans
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
        this._version = props.version ?? 1;
    }

    private validate(props: PlanProps): void {
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

    private generatePlanCode(name: string): string {
        return name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    }

    // Getters
    get id(): string { return this._id; }
    get planFamilyId(): string | undefined { return this._planFamilyId; }
    get name(): string { return this._name; }
    get planCode(): string { return this._planCode; }
    get planType(): PlanType { return this._planType; }
    get productIds(): string[] { return [...this._productIds]; }
    get price(): Price { return this._price; }
    get renewalDefinition(): RenewalDefinition | undefined { return this._renewalDefinition; }
    get trialPeriod(): TimePeriod | undefined { return this._trialPeriod; }
    get active(): boolean { return this._active; }
    get status(): 'active' | 'archived' | 'draft' | 'published' { return this._status; }
    
    /**
     * Checks if the plan is published (immutable)
     */
    get isPublished(): boolean {
        return this._status === 'published';
    }
    
    /**
     * Checks if the plan can be modified in-place
     */
    get isMutable(): boolean {
        return this._status !== 'published';
    }
    get metadata(): Record<string, any> | undefined { return this._metadata; }
    get createdAt(): Date { return this._createdAt; }
    get version(): number { return this._version; }

    // Business methods

    /**
     * Creates a new version of this plan.
     * The current plan instance should be archived after calling this.
     * For published plans, the new version will also be published.
     */
    createNewVersion(changes: Partial<PlanProps>): Plan {
        // Determine status for new version
        // If original is published, new version should also be published
        // Otherwise, default to draft
        const newStatus = this._status === 'published' ? 'published' : 'draft';
        
        // Create new plan with same planFamilyId and planCode but new ID
        return new Plan({
            ...this.toProps(),
            ...changes,
            id: undefined, // Will generate new ID
            planFamilyId: this._planFamilyId, // Keep same family (family ID is excluded from versioning)
            planCode: this._planCode, // Keep same plan code
            status: newStatus,
            createdAt: new Date(),
            version: this._version + 1,
        });
    }

    archive(): void {
        this._status = 'archived';
        this._active = false;
    }
    
    /**
     * Publishes the plan, making it immutable.
     * Once published, all updates must create new versions.
     */
    publish(): void {
        if (this._status === 'published') {
            throw new Error('Plan is already published');
        }
        if (this._status === 'archived') {
            throw new Error('Cannot publish an archived plan');
        }
        this._status = 'published';
        this._active = true;
    }
    
    /**
     * Unpublishes the plan, making it mutable again.
     * Only draft or active plans can be unpublished.
     */
    unpublish(): void {
        if (this._status !== 'published') {
            throw new Error('Plan is not published');
        }
        this._status = 'draft';
    }

    toProps(): PlanProps {
        return {
            id: this._id,
            planFamilyId: this._planFamilyId,
            name: this._name,
            planCode: this._planCode,
            planType: this._planType,
            productIds: this._productIds,
            price: this._price,
            renewalDefinition: this._renewalDefinition,
            trialPeriod: this._trialPeriod,
            active: this._active,
            status: this._status,
            metadata: this._metadata,
            createdAt: this._createdAt,
            version: this._version,
        };
    }

    /**
     * Sets the plan family ID and syncs planCode from family
     */
    setPlanFamily(planFamilyId: string, planCode: string): void {
        this._planFamilyId = planFamilyId;
        this._planCode = planCode;
    }

    // Legacy / mutation methods - restricted for published plans
    private ensureMutable(): void {
        if (this.isPublished) {
            throw new Error('Cannot modify a published plan. Create a new version instead.');
        }
    }
    
    updatePrice(newPrice: Price): void {
        this.ensureMutable();
        this._price = newPrice;
    }
    
    updateName(newName: string): void {
        this.ensureMutable();
        if (!newName || newName.trim() === '') throw new Error('Plan name cannot be empty');
        this._name = newName;
    }
    
    activate(): void {
        this.ensureMutable();
        this._active = true;
        this._status = 'active';
    }
    
    deactivate(): void {
        this.ensureMutable();
        this._active = false;
        this._status = 'archived';
    }
    
    updatePlanType(type: PlanType): void {
        this.ensureMutable();
        this._planType = type;
    }
    
    updateMetadata(metadata: Record<string, any>): void {
        this.ensureMutable();
        this._metadata = { ...this._metadata, ...metadata };
    }
    
    addProduct(productId: string): void {
        this.ensureMutable();
        if (!this._productIds.includes(productId)) this._productIds.push(productId);
    }
    
    removeProduct(productId: string): void {
        this.ensureMutable();
        this._productIds = this._productIds.filter(id => id !== productId);
        if (this._productIds.length === 0) throw new Error('Plan must have at least one product');
    }
    
    updateRenewalDefinition(renewalDefinition: RenewalDefinition): void {
        this.ensureMutable();
        this._renewalDefinition = renewalDefinition;
    }
    
    updateTrialPeriod(trialPeriod: TimePeriod): void {
        this.ensureMutable();
        this._trialPeriod = trialPeriod;
    }
    hasTrialPeriod(): boolean { return this._trialPeriod !== undefined; }
    hasRenewalDefinition(): boolean { return this._renewalDefinition !== undefined; }

    /**
     * Applies updates directly to this plan instance.
     * This encapsulates the in-place mutation logic that was previously in the domain service.
     * Throws error if plan is published (immutable).
     */
    applyDirectUpdates(changes: Partial<PlanProps>): void {
        if (this.isPublished) {
            throw new Error('Cannot apply direct updates to a published plan. Create a new version instead.');
        }
        if (changes.name !== undefined) {
            this.updateName(changes.name);
        }
        if (changes.planType !== undefined) {
            this.updatePlanType(changes.planType);
        }
        if (changes.price !== undefined) {
            this.updatePrice(changes.price);
        }
        if (changes.renewalDefinition !== undefined) {
            this.updateRenewalDefinition(changes.renewalDefinition);
        }
        if (changes.trialPeriod !== undefined) {
            this.updateTrialPeriod(changes.trialPeriod);
        }
        if (changes.metadata !== undefined) {
            this.updateMetadata(changes.metadata);
        }
        if (changes.productIds !== undefined) {
            const currentProductIds = [...this._productIds];
            const newProductIds = changes.productIds;

            // Remove products that are no longer in the list
            for (const productId of currentProductIds) {
                if (!newProductIds.includes(productId)) {
                    this.removeProduct(productId);
                }
            }

            // Add new products
            for (const productId of newProductIds) {
                if (!currentProductIds.includes(productId)) {
                    this.addProduct(productId);
                }
            }
        }
    }
}
