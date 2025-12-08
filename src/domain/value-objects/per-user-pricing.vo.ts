import { PricingModel } from './pricing-model.vo';

export interface PerUserPricingProps {
    id?: string;
    pricingModelId: string;
    pricePerUser: number; // in minor currency units (e.g., cents)
    minUsers: number;
}

/**
 * Value object for per-user pricing model.
 * Charges a flat rate per active user per billing period.
 */
export class PerUserPricing {
    private readonly _id?: string;
    private readonly _pricingModelId: string;
    private readonly _pricePerUser: number;
    private readonly _minUsers: number;

    constructor(props: PerUserPricingProps) {
        this.validate(props);
        this._id = props.id;
        this._pricingModelId = props.pricingModelId;
        this._pricePerUser = props.pricePerUser;
        this._minUsers = props.minUsers;
    }

    private validate(props: PerUserPricingProps): void {
        if (!props.pricingModelId || props.pricingModelId.trim() === '') {
            throw new Error('pricingModelId is required');
        }
        if (props.pricePerUser <= 0) {
            throw new Error('pricePerUser must be greater than 0');
        }
        if (props.minUsers < 1) {
            throw new Error('minUsers must be at least 1');
        }
    }

    get id(): string | undefined { return this._id; }
    get pricingModelId(): string { return this._pricingModelId; }
    get pricePerUser(): number { return this._pricePerUser; }
    get minUsers(): number { return this._minUsers; }

    /**
     * Calculates the total charge for a given number of users.
     */
    calculateCharge(userCount: number): number {
        const effectiveUsers = Math.max(userCount, this._minUsers);
        return effectiveUsers * this._pricePerUser;
    }
}

