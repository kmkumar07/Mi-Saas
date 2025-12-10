export interface VolumePricingVolumeProps {
    id?: string;
    pricingModelId?: string;
    volumeIndex: number;
    maxVolume?: number | null;
    pricePerUnit: number; // in minor currency units (e.g., cents)
    unitName: string;
}

/**
 * Value object representing a single volume in volume pricing.
 */
export class VolumePricingVolume {
    private readonly _id?: string;
    private readonly _pricingModelId?: string;
    private readonly _volumeIndex: number;
    private readonly _maxVolume?: number | null;
    private readonly _pricePerUnit: number;
    private readonly _unitName: string;

    constructor(props: VolumePricingVolumeProps) {
        this.validate(props);
        this._id = props.id;
        this._pricingModelId = props.pricingModelId;
        this._volumeIndex = props.volumeIndex;
        this._maxVolume = props.maxVolume ?? null;
        this._pricePerUnit = props.pricePerUnit;
        this._unitName = props.unitName;
    }

    private validate(props: VolumePricingVolumeProps): void {
        if (props.maxVolume !== undefined && props.maxVolume !== null && props.maxVolume <= 0) {
            throw new Error('maxVolume must be greater than 0 when provided');
        }
        if (props.pricePerUnit <= 0) {
            throw new Error('pricePerUnit must be greater than 0');
        }
        if (!props.unitName || props.unitName.trim() === '') {
            throw new Error('unitName is required');
        }
        if (props.volumeIndex < 0) {
            throw new Error('volumeIndex must be >= 0');
        }
    }

    get id(): string | undefined { return this._id; }
    get pricingModelId(): string | undefined { return this._pricingModelId; }
    get volumeIndex(): number { return this._volumeIndex; }
    get maxVolume(): number | null | undefined { return this._maxVolume; }
    get pricePerUnit(): number { return this._pricePerUnit; }
    get unitName(): string { return this._unitName; }

    /**
     * Checks whether the given quantity falls within this volume's range.
     */
    contains(quantity: number): boolean {
        // First volume starts from 0 or 1
        if (this._volumeIndex === 0) {
            if (this._maxVolume == null) return true;
            return quantity <= this._maxVolume;
        }
        // For subsequent volumes, we need to check against previous volume's max
        // This is handled by the VolumePricing class
        return false;
    }
}

/**
 * Value object for volume pricing model.
 * Volume pricing applies a single price based on total usage volume.
 * The price is determined by which volume bracket the total usage falls into.
 */
export class VolumePricing {
    private readonly _pricingModelId: string;
    private readonly _volumes: VolumePricingVolume[];
    private readonly _unitName: string;

    constructor(pricingModelId: string, volumes: VolumePricingVolume[], unitName: string) {
        if (!pricingModelId || pricingModelId.trim() === '') {
            throw new Error('pricingModelId is required');
        }
        if (!volumes || volumes.length === 0) {
            throw new Error('At least one volume is required for volume pricing');
        }
        if (!unitName || unitName.trim() === '') {
            throw new Error('unitName is required');
        }

        // Validate volumes are sorted by maxVolume
        const sorted = [...volumes].sort((a, b) => {
            const aMax = a.maxVolume ?? Number.MAX_SAFE_INTEGER;
            const bMax = b.maxVolume ?? Number.MAX_SAFE_INTEGER;
            return aMax - bMax;
        });

        this._pricingModelId = pricingModelId;
        this._volumes = sorted;
        this._unitName = unitName;
    }

    get pricingModelId(): string { return this._pricingModelId; }
    get volumes(): VolumePricingVolume[] { return [...this._volumes]; }
    get unitName(): string { return this._unitName; }

    /**
     * Finds the volume that applies to the given total quantity.
     */
    findVolumeForQuantity(quantity: number): VolumePricingVolume | null {
        for (const volume of this._volumes) {
            if (volume.maxVolume == null) {
                // This is the last (open-ended) volume
                return volume;
            }
            if (quantity <= volume.maxVolume) {
                return volume;
            }
        }
        return null;
    }

    /**
     * Calculates the total charge for a given quantity.
     * In volume pricing, all units are charged at the rate of the volume bracket that the total falls into.
     */
    calculateCharge(quantity: number): number {
        if (quantity <= 0) return 0;
        const volume = this.findVolumeForQuantity(quantity);
        if (!volume) {
            throw new Error(`No volume found for quantity ${quantity}`);
        }
        return quantity * volume.pricePerUnit;
    }
}

