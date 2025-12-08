export interface PerUsagePricingProps {
    id?: string;
    pricingModelId: string;
    pricePerUnit: number; // in minor currency units (e.g., cents)
    unitName: string;
}

/**
 * Value object for per-usage pricing model.
 * Charges a fixed price per unit of usage.
 */
export class PerUsagePricing {
    private readonly _id?: string;
    private readonly _pricingModelId: string;
    private readonly _pricePerUnit: number;
    private readonly _unitName: string;

    constructor(props: PerUsagePricingProps) {
        this.validate(props);
        this._id = props.id;
        this._pricingModelId = props.pricingModelId;
        this._pricePerUnit = props.pricePerUnit;
        this._unitName = props.unitName;
    }

    private validate(props: PerUsagePricingProps): void {
        if (!props.pricingModelId || props.pricingModelId.trim() === '') {
            throw new Error('pricingModelId is required');
        }
        if (props.pricePerUnit <= 0) {
            throw new Error('pricePerUnit must be greater than 0');
        }
        if (!props.unitName || props.unitName.trim() === '') {
            throw new Error('unitName is required');
        }
    }

    get id(): string | undefined { return this._id; }
    get pricingModelId(): string { return this._pricingModelId; }
    get pricePerUnit(): number { return this._pricePerUnit; }
    get unitName(): string { return this._unitName; }

    /**
     * Calculates the total charge for a given quantity of usage.
     */
    calculateCharge(quantity: number): number {
        if (quantity <= 0) return 0;
        return quantity * this._pricePerUnit;
    }
}

