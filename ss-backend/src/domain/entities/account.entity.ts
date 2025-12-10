import { randomUUID } from 'crypto';

export interface AccountProps {
    id?: string;
    tenantId: string;
    parentAccountId?: string;

    // Company Information
    companyName: string;
    legalName?: string;
    taxId?: string;

    // Billing Address
    billingEmail: string;
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingState?: string;
    billingPostalCode?: string;
    billingCountry?: string; // ISO 3166-1 alpha-2

    // Payment Information
    paymentMethod?: string;
    paymentGatewayCustomerId?: string;

    // Account Status
    accountStatus?: 'active' | 'suspended' | 'closed';
    creditLimit?: number;
    currentBalance?: number;

    // Metadata
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Account {
    private readonly _id: string;
    private readonly _tenantId: string;
    private _parentAccountId?: string;

    // Company Information
    private _companyName: string;
    private _legalName?: string;
    private _taxId?: string;

    // Billing Address
    private _billingEmail: string;
    private _billingAddressLine1?: string;
    private _billingAddressLine2?: string;
    private _billingCity?: string;
    private _billingState?: string;
    private _billingPostalCode?: string;
    private _billingCountry?: string;

    // Payment Information
    private _paymentMethod?: string;
    private _paymentGatewayCustomerId?: string;

    // Account Status
    private _accountStatus: 'active' | 'suspended' | 'closed';
    private _creditLimit?: number;
    private _currentBalance: number;

    // Metadata
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    constructor(props: AccountProps) {
        this.validate(props);

        this._id = props.id || randomUUID();
        this._tenantId = props.tenantId;
        this._parentAccountId = props.parentAccountId;

        this._companyName = props.companyName;
        this._legalName = props.legalName;
        this._taxId = props.taxId;

        this._billingEmail = props.billingEmail;
        this._billingAddressLine1 = props.billingAddressLine1;
        this._billingAddressLine2 = props.billingAddressLine2;
        this._billingCity = props.billingCity;
        this._billingState = props.billingState;
        this._billingPostalCode = props.billingPostalCode;
        this._billingCountry = props.billingCountry;

        this._paymentMethod = props.paymentMethod;
        this._paymentGatewayCustomerId = props.paymentGatewayCustomerId;

        this._accountStatus = props.accountStatus || 'active';
        this._creditLimit = props.creditLimit;
        this._currentBalance = props.currentBalance || 0;

        this._metadata = props.metadata;
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }

    private validate(props: AccountProps): void {
        if (!props.tenantId || props.tenantId.trim() === '') {
            throw new Error('Tenant ID is required');
        }

        if (!props.companyName || props.companyName.trim() === '') {
            throw new Error('Company name is required');
        }

        if (props.companyName.length > 255) {
            throw new Error('Company name must be less than 255 characters');
        }

        if (!props.billingEmail || props.billingEmail.trim() === '') {
            throw new Error('Billing email is required');
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(props.billingEmail)) {
            throw new Error('Invalid billing email format');
        }

        // Validate country code if provided (ISO 3166-1 alpha-2)
        if (props.billingCountry && props.billingCountry.length !== 2) {
            throw new Error('Billing country must be a 2-letter ISO 3166-1 alpha-2 code');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get tenantId(): string {
        return this._tenantId;
    }

    get parentAccountId(): string | undefined {
        return this._parentAccountId;
    }

    get companyName(): string {
        return this._companyName;
    }

    get legalName(): string | undefined {
        return this._legalName;
    }

    get taxId(): string | undefined {
        return this._taxId;
    }

    get billingEmail(): string {
        return this._billingEmail;
    }

    get billingAddressLine1(): string | undefined {
        return this._billingAddressLine1;
    }

    get billingAddressLine2(): string | undefined {
        return this._billingAddressLine2;
    }

    get billingCity(): string | undefined {
        return this._billingCity;
    }

    get billingState(): string | undefined {
        return this._billingState;
    }

    get billingPostalCode(): string | undefined {
        return this._billingPostalCode;
    }

    get billingCountry(): string | undefined {
        return this._billingCountry;
    }

    get paymentMethod(): string | undefined {
        return this._paymentMethod;
    }

    get paymentGatewayCustomerId(): string | undefined {
        return this._paymentGatewayCustomerId;
    }

    get accountStatus(): 'active' | 'suspended' | 'closed' {
        return this._accountStatus;
    }

    get creditLimit(): number | undefined {
        return this._creditLimit;
    }

    get currentBalance(): number {
        return this._currentBalance;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    // Business methods
    updateBillingAddress(address: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    }): void {
        if (address.country && address.country.length !== 2) {
            throw new Error('Country must be a 2-letter ISO 3166-1 alpha-2 code');
        }

        if (address.line1 !== undefined) this._billingAddressLine1 = address.line1;
        if (address.line2 !== undefined) this._billingAddressLine2 = address.line2;
        if (address.city !== undefined) this._billingCity = address.city;
        if (address.state !== undefined) this._billingState = address.state;
        if (address.postalCode !== undefined) this._billingPostalCode = address.postalCode;
        if (address.country !== undefined) this._billingCountry = address.country;

        this._updatedAt = new Date();
    }

    updatePaymentMethod(paymentMethod: string, gatewayCustomerId?: string): void {
        this._paymentMethod = paymentMethod;
        if (gatewayCustomerId) {
            this._paymentGatewayCustomerId = gatewayCustomerId;
        }
        this._updatedAt = new Date();
    }

    suspend(): void {
        if (this._accountStatus === 'closed') {
            throw new Error('Cannot suspend a closed account');
        }
        this._accountStatus = 'suspended';
        this._updatedAt = new Date();
    }

    activate(): void {
        if (this._accountStatus === 'closed') {
            throw new Error('Cannot activate a closed account');
        }
        this._accountStatus = 'active';
        this._updatedAt = new Date();
    }

    close(): void {
        this._accountStatus = 'closed';
        this._updatedAt = new Date();
    }

    isActive(): boolean {
        return this._accountStatus === 'active';
    }

    isSuspended(): boolean {
        return this._accountStatus === 'suspended';
    }

    isClosed(): boolean {
        return this._accountStatus === 'closed';
    }

    updateBalance(amount: number): void {
        this._currentBalance += amount;
        this._updatedAt = new Date();
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
        this._updatedAt = new Date();
    }
}
