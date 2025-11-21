import { randomUUID } from 'crypto';
import { ChargeModel, FeatureType } from '../enums';

export interface FeatureProps {
    id?: string;
    productId: string;
    name: string;
    code: string;
    description?: string;
    featureType: FeatureType;
    chargeModel: ChargeModel;
    serviceUrl?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

export class Feature {
    private readonly _id: string;
    private readonly _productId: string;
    private _name: string;
    private readonly _code: string;
    private _description?: string;
    private _featureType: FeatureType;
    private _chargeModel: ChargeModel;
    private _serviceUrl?: string;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: FeatureProps) {
        this.validate(props);
        this._id = props.id || randomUUID(); // Generate UUID if not provided
        this._productId = props.productId;
        this._name = props.name;
        this._code = props.code;
        this._description = props.description;
        this._featureType = props.featureType;
        this._chargeModel = props.chargeModel;
        this._serviceUrl = props.serviceUrl;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
    }

    private validate(props: FeatureProps): void {
        if (!props.productId || props.productId.trim() === '') {
            throw new Error('Product ID is required');
        }

        if (!props.name || props.name.trim() === '') {
            throw new Error('Feature name is required');
        }

        if (!props.code || props.code.trim() === '') {
            throw new Error('Feature code is required');
        }

        // Business rule: Feature code must follow naming convention
        if (!/^[a-z0-9_]+$/.test(props.code)) {
            throw new Error('Feature code must be lowercase alphanumeric with underscores only');
        }

        // Business rule: Metered features must have a service URL
        if (props.featureType === FeatureType.METERED && !props.serviceUrl) {
            throw new Error('Metered features must have a service URL for tracking');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get productId(): string {
        return this._productId;
    }

    get name(): string {
        return this._name;
    }

    get code(): string {
        return this._code;
    }

    get description(): string | undefined {
        return this._description;
    }

    get featureType(): FeatureType {
        return this._featureType;
    }

    get chargeModel(): ChargeModel {
        return this._chargeModel;
    }

    get serviceUrl(): string | undefined {
        return this._serviceUrl;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    // Business methods
    updateName(newName: string): void {
        if (!newName || newName.trim() === '') {
            throw new Error('Feature name cannot be empty');
        }
        this._name = newName;
    }

    updateDescription(description: string): void {
        this._description = description;
    }

    updateChargeModel(chargeModel: ChargeModel): void {
        this._chargeModel = chargeModel;
    }

    updateServiceUrl(url: string): void {
        this._serviceUrl = url;
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
    }
}
