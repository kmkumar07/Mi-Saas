export interface TieredPricingTierProps {
    id?: string;
    pricingModelId?: string;
    tierIndex: number;
    fromQuantity: number;
    toQuantity?: number | null;
    pricePerUnit: number; // in minor currency units (e.g., cents)
    unitName: string;
}

/**
 * Value object representing a single tier in tiered pricing.
 * In tiered pricing, the price depends on which tier the total usage falls into.
 */
export class TieredPricingTier {
    private readonly _id?: string;
    private readonly _pricingModelId?: string;
    private readonly _tierIndex: number;
    private readonly _fromQuantity: number;
    private readonly _toQuantity?: number | null;
    private readonly _pricePerUnit: number;
    private readonly _unitName: string;

    constructor(props: TieredPricingTierProps) {
        this.validate(props);
        this._id = props.id;
        this._pricingModelId = props.pricingModelId;
        this._tierIndex = props.tierIndex;
        this._fromQuantity = props.fromQuantity;
        this._toQuantity = props.toQuantity ?? null;
        this._pricePerUnit = props.pricePerUnit;
        this._unitName = props.unitName;
    }

    private validate(props: TieredPricingTierProps): void {
        if (props.fromQuantity < 0) {
            throw new Error('fromQuantity must be >= 0');
        }
        if (props.toQuantity !== undefined && props.toQuantity !== null && props.toQuantity <= props.fromQuantity) {
            throw new Error('toQuantity must be greater than fromQuantity when provided');
        }
        if (props.pricePerUnit <= 0) {
            throw new Error('pricePerUnit must be greater than 0');
        }
        if (!props.unitName || props.unitName.trim() === '') {
            throw new Error('unitName is required');
        }
        if (props.tierIndex < 0) {
            throw new Error('tierIndex must be >= 0');
        }
    }

    get id(): string | undefined { return this._id; }
    get pricingModelId(): string | undefined { return this._pricingModelId; }
    get tierIndex(): number { return this._tierIndex; }
    get fromQuantity(): number { return this._fromQuantity; }
    get toQuantity(): number | null | undefined { return this._toQuantity; }
    get pricePerUnit(): number { return this._pricePerUnit; }
    get unitName(): string { return this._unitName; }

    /**
     * Checks whether the given quantity falls into this tier's range.
     */
    contains(quantity: number): boolean {
        if (quantity < this._fromQuantity) return false;
        if (this._toQuantity == null) return true;
        return quantity <= this._toQuantity;
    }
}

/**
 * Value object for tiered pricing model.
 * In tiered pricing, the price depends on which tier the total usage falls into.
 * All units are charged at the rate of the tier that the total usage falls into.
 */
export class TieredPricing {
    private readonly _pricingModelId: string;
    private readonly _tiers: TieredPricingTier[];
    private readonly _unitName: string;

    constructor(pricingModelId: string, tiers: TieredPricingTier[], unitName: string) {
        if (!pricingModelId || pricingModelId.trim() === '') {
            throw new Error('pricingModelId is required');
        }
        if (!tiers || tiers.length === 0) {
            throw new Error('At least one tier is required for tiered pricing');
        }
        if (!unitName || unitName.trim() === '') {
            throw new Error('unitName is required');
        }

        // Validate tiers are non-overlapping and sorted
        const sorted = [...tiers].sort((a, b) => a.fromQuantity - b.fromQuantity);
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            const currentTo = current.toQuantity ?? Number.MAX_SAFE_INTEGER;
            if (next.fromQuantity <= currentTo) {
                throw new Error('Tiered pricing tiers must have non-overlapping ranges');
            }
        }

        this._pricingModelId = pricingModelId;
        this._tiers = sorted;
        this._unitName = unitName;
    }

    get pricingModelId(): string { return this._pricingModelId; }
    get tiers(): TieredPricingTier[] { return [...this._tiers]; }
    get unitName(): string { return this._unitName; }

    /**
     * Finds the tier that applies to the given total quantity.
     */
    findTierForQuantity(quantity: number): TieredPricingTier | null {
        for (const tier of this._tiers) {
            if (tier.contains(quantity)) {
                return tier;
            }
        }
        return null;
    }

    /**
     * Calculates the total charge for a given quantity.
     * In tiered pricing, all units are charged at the rate of the tier that the total falls into.
     */
    calculateCharge(quantity: number): number {
        if (quantity <= 0) return 0;
        const tier = this.findTierForQuantity(quantity);
        if (!tier) {
            throw new Error(`No tier found for quantity ${quantity}`);
        }
        return quantity * tier.pricePerUnit;
    }
}

