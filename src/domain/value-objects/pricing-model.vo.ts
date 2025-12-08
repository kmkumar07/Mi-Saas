import { ChargeModel } from '../enums';

export interface PricingModelProps {
    id?: string;
    planFeatureId: string;
    type: ChargeModel;
    currency: string;
    details?: Record<string, any>;
    createdAt?: Date;
}

/**
 * Base value object for pricing models.
 * This is a polymorphic type that can represent different pricing model types.
 */
export class PricingModel {
    private readonly _id?: string;
    private readonly _planFeatureId: string;
    private readonly _type: ChargeModel;
    private readonly _currency: string;
    private readonly _details?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: PricingModelProps) {
        this.validate(props);
        this._id = props.id;
        this._planFeatureId = props.planFeatureId;
        this._type = props.type;
        this._currency = props.currency.toUpperCase();
        this._details = props.details;
        this._createdAt = props.createdAt ?? new Date();
    }

    private validate(props: PricingModelProps): void {
        if (!props.planFeatureId || props.planFeatureId.trim() === '') {
            throw new Error('planFeatureId is required');
        }
        if (!props.type) {
            throw new Error('type is required');
        }
        if (!props.currency || props.currency.trim().length !== 3) {
            throw new Error('currency must be a 3-letter ISO code (e.g., USD)');
        }
    }

    get id(): string | undefined { return this._id; }
    get planFeatureId(): string { return this._planFeatureId; }
    get type(): ChargeModel { return this._type; }
    get currency(): string { return this._currency; }
    get details(): Record<string, any> | undefined { return this._details; }
    get createdAt(): Date { return this._createdAt; }
}

