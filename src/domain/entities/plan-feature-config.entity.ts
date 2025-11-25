import { FeatureType } from '../enums';
import { FeaturePricingTier } from '../value-objects/feature-pricing-tier.vo';

export interface PlanFeatureConfigProps {
    id?: string;
    planId: string;
    featureId: string;
    featureType: FeatureType;
    isActive?: boolean;
    /**
     * Maximum allowed quantity for QUOTA features within a billing period.
     * Only meaningful when featureType === FeatureType.QUOTA.
     */
    quotaLimit?: number;
    pricingTiers?: FeaturePricingTier[];
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Per-plan configuration for a specific feature.
 *
 * Encapsulates whether the feature is available on the plan, any quota limits,
 * and (for metered features) the tiered pricing configuration.
 */
export class PlanFeatureConfig {
    private readonly _id?: string;
    private readonly _planId: string;
    private readonly _featureId: string;
    private readonly _featureType: FeatureType;
    private _isActive: boolean;
    private _quotaLimit?: number;
    private _pricingTiers: FeaturePricingTier[];
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    constructor(props: PlanFeatureConfigProps) {
        this.validate(props);

        this._id = props.id;
        this._planId = props.planId;
        this._featureId = props.featureId;
        this._featureType = props.featureType;
        this._isActive = props.isActive ?? true;
        this._quotaLimit = props.quotaLimit;
        this._pricingTiers = props.pricingTiers ?? [];
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();

        // Ensure tiers, if any, are valid as a whole
        this.validateTiers(this._pricingTiers);
    }

    private validate(props: PlanFeatureConfigProps): void {
        if (!props.planId || props.planId.trim() === '') {
            throw new Error('planId is required for PlanFeatureConfig');
        }
        if (!props.featureId || props.featureId.trim() === '') {
            throw new Error('featureId is required for PlanFeatureConfig');
        }

        if (props.featureType === FeatureType.QUOTA && props.quotaLimit !== undefined && props.quotaLimit <= 0) {
            throw new Error('quotaLimit must be greater than 0 for QUOTA features');
        }

        if (props.featureType !== FeatureType.QUOTA && props.quotaLimit !== undefined) {
            throw new Error('quotaLimit is only allowed for QUOTA features');
        }

        if (props.featureType !== FeatureType.METERED && props.pricingTiers && props.pricingTiers.length > 0) {
            throw new Error('pricing tiers are only allowed for METERED features');
        }
    }

    private validateTiers(tiers: FeaturePricingTier[]): void {
        if (!tiers || tiers.length === 0) return;

        const sorted = [...tiers].sort((a, b) => a.fromQuantity - b.fromQuantity);

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            const currentTo = current.toQuantity ?? Number.MAX_SAFE_INTEGER;
            if (next.fromQuantity <= currentTo) {
                throw new Error('Feature pricing tiers must have non-overlapping ranges');
            }
        }
    }

    get id(): string | undefined { return this._id; }
    get planId(): string { return this._planId; }
    get featureId(): string { return this._featureId; }
    get featureType(): FeatureType { return this._featureType; }
    get isActive(): boolean { return this._isActive; }
    get quotaLimit(): number | undefined { return this._quotaLimit; }
    get pricingTiers(): FeaturePricingTier[] { return [...this._pricingTiers]; }
    get metadata(): Record<string, any> | undefined { return this._metadata; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    isAvailable(): boolean {
        return this._isActive;
    }

    hasQuota(): boolean {
        return this._featureType === FeatureType.QUOTA && this._quotaLimit !== undefined;
    }

    /**
     * Replaces pricing tiers for this config (only allowed for metered features).
     */
    setPricingTiers(tiers: FeaturePricingTier[]): void {
        if (this._featureType !== FeatureType.METERED && tiers.length > 0) {
            throw new Error('Can only configure pricing tiers for METERED features');
        }
        this.validateTiers(tiers);
        this._pricingTiers = [...tiers];
        this.touch();
    }

    setQuotaLimit(limit?: number): void {
        if (this._featureType !== FeatureType.QUOTA && limit !== undefined) {
            throw new Error('quotaLimit is only allowed for QUOTA features');
        }
        if (limit !== undefined && limit <= 0) {
            throw new Error('quotaLimit must be greater than 0');
        }
        this._quotaLimit = limit;
        this.touch();
    }

    activate(): void {
        this._isActive = true;
        this.touch();
    }

    deactivate(): void {
        this._isActive = false;
        this.touch();
    }

    private touch(): void {
        this._updatedAt = new Date();
    }
}


