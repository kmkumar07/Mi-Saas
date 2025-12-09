export interface TenantProps {
    id?: string;
    name: string;
    emailDomain?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

export class Tenant {
    private readonly _id?: string;
    private _name: string;
    private _emailDomain?: string;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: TenantProps) {
        this.validate(props);
        this._id = props.id;
        this._name = props.name;
        this._emailDomain = props.emailDomain;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
    }

    private validate(props: TenantProps): void {
        if (!props.name || props.name.trim() === '') {
            throw new Error('Tenant name is required');
        }

        if (props.name.length > 255) {
            throw new Error('Tenant name must be less than 255 characters');
        }
    }

    // Getters
    get id(): string | undefined {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get emailDomain(): string | undefined {
        return this._emailDomain;
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
            throw new Error('Tenant name cannot be empty');
        }
        this._name = newName;
    }

    updateEmailDomain(domain: string): void {
        this._emailDomain = domain;
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
    }
}
