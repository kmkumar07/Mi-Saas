export interface GraduatedPricingTierProps {
    id?: string;
    pricingModelId?: string;
    tierIndex: number;
    fromQuantity: number;
    toQuantity?: number | null;
    pricePerUnit: number; // in minor currency units (e.g., cents)
    unitName: string;
}

/**
 * Value object representing a single tier in graduated pricing.
 */
export class GraduatedPricingTier {
    private readonly _id?: string;
    private readonly _pricingModelId?: string;
    private readonly _tierIndex: number;
    private readonly _fromQuantity: number;
    private readonly _toQuantity?: number | null;
    private readonly _pricePerUnit: number;
    private readonly _unitName: string;

    constructor(props: GraduatedPricingTierProps) {
        this.validate(props);
        this._id = props.id;
        this._pricingModelId = props.pricingModelId;
        this._tierIndex = props.tierIndex;
        this._fromQuantity = props.fromQuantity;
        this._toQuantity = props.toQuantity ?? null;
        this._pricePerUnit = props.pricePerUnit;
        this._unitName = props.unitName;
    }

    private validate(props: GraduatedPricingTierProps): void {
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

    /**
     * Calculates the charge for a given quantity within this tier only.
     */
    chargeFor(quantity: number): number {
        if (quantity <= 0) return 0;
        return quantity * this._pricePerUnit;
    }
}

/**
 * Value object for graduated pricing model.
 * Graduated pricing applies different prices for each tier segment of usage.
 * Each tier segment is charged at its own rate.
 */
export class GraduatedPricing {
    private readonly _pricingModelId: string;
    private readonly _tiers: GraduatedPricingTier[];
    private readonly _unitName: string;

    constructor(pricingModelId: string, tiers: GraduatedPricingTier[], unitName: string) {
        if (!pricingModelId || pricingModelId.trim() === '') {
            throw new Error('pricingModelId is required');
        }
        if (!tiers || tiers.length === 0) {
            throw new Error('At least one tier is required for graduated pricing');
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
                throw new Error('Graduated pricing tiers must have non-overlapping ranges');
            }
        }

        this._pricingModelId = pricingModelId;
        this._tiers = sorted;
        this._unitName = unitName;
    }

    get pricingModelId(): string { return this._pricingModelId; }
    get tiers(): GraduatedPricingTier[] { return [...this._tiers]; }
    get unitName(): string { return this._unitName; }

    /**
     * Calculates the total charge for a given quantity.
     * In graduated pricing, each tier segment is charged at its own rate.
     */
    calculateCharge(quantity: number): number {
        if (quantity <= 0) return 0;

        let totalCharge = 0;
        let remaining = quantity;

        for (const tier of this._tiers) {
            if (remaining <= 0) break;

            const tierFrom = tier.fromQuantity;
            const tierTo = tier.toQuantity ?? Number.MAX_SAFE_INTEGER;
            const tierMax = Math.min(tierTo, quantity);

            if (quantity > tierFrom) {
                const tierQuantity = Math.min(remaining, tierMax - tierFrom + 1);
                if (tierQuantity > 0) {
                    totalCharge += tier.chargeFor(tierQuantity);
                    remaining -= tierQuantity;
                }
            }
        }

        return totalCharge;
    }
}

