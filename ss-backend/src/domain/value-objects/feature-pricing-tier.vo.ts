import { Price } from './price.vo';

export interface FeaturePricingTierProps {
    id?: string;
    planFeatureConfigId?: string;
    /**
     * Inclusive lower bound for this tier.
     */
    fromQuantity: number;
    /**
     * Inclusive upper bound for this tier.
     * When undefined/null, the tier is open-ended.
     */
    toQuantity?: number | null;
    /**
     * Price per unit in minor currency units (e.g. cents).
     */
    pricePerUnit: number;
    currency: string;
}

/**
 * Value object representing a single tier in a metered feature's pricing.
 */
export class FeaturePricingTier {
    private readonly _id?: string;
    private readonly _planFeatureConfigId?: string;
    private readonly _fromQuantity: number;
    private readonly _toQuantity?: number | null;
    private readonly _pricePerUnit: number;
    private readonly _currency: string;

    constructor(props: FeaturePricingTierProps) {
        this.validate(props);
        this._id = props.id;
        this._planFeatureConfigId = props.planFeatureConfigId;
        this._fromQuantity = props.fromQuantity;
        this._toQuantity = props.toQuantity ?? null;
        this._pricePerUnit = props.pricePerUnit;
        this._currency = props.currency.toUpperCase();
    }

    private validate(props: FeaturePricingTierProps): void {
        if (props.fromQuantity < 0) {
            throw new Error('fromQuantity must be >= 0');
        }
        if (props.toQuantity !== undefined && props.toQuantity !== null && props.toQuantity <= props.fromQuantity) {
            throw new Error('toQuantity must be greater than fromQuantity when provided');
        }
        if (props.pricePerUnit <= 0) {
            throw new Error('pricePerUnit must be greater than 0');
        }
        if (!props.currency || props.currency.trim().length !== 3) {
            throw new Error('currency must be a 3-letter ISO code (e.g., USD)');
        }
    }

    get id(): string | undefined { return this._id; }
    get planFeatureConfigId(): string | undefined { return this._planFeatureConfigId; }
    get fromQuantity(): number { return this._fromQuantity; }
    get toQuantity(): number | null | undefined { return this._toQuantity; }
    get pricePerUnit(): number { return this._pricePerUnit; }
    get currency(): string { return this._currency; }

    /**
     * Checks whether the given quantity falls into this tier's range.
     */
    contains(quantity: number): boolean {
        if (quantity < this._fromQuantity) return false;
        if (this._toQuantity == null) return true;
        return quantity <= this._toQuantity;
    }

    /**
     * Computes the charge for a given quantity within this tier only.
     * Caller is responsible for deciding which tier applies to which portion.
     */
    chargeFor(quantity: number): number {
        if (quantity <= 0) return 0;
        return quantity * this._pricePerUnit;
    }
}


