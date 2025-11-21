import { RecurringChargePeriod } from './recurring-charge-period.vo';

/**
 * Price Value Object
 * Represents a price with recurring charge period
 */
export class Price {
    private readonly _priceId: string;
    private readonly _value: number;
    private readonly _currency: string;
    private readonly _isActive: boolean;
    private readonly _description?: string;
    private readonly _recurringChargePeriod: RecurringChargePeriod;

    constructor(
        value: number,
        currency: string,
        recurringChargePeriod: RecurringChargePeriod,
        isActive: boolean = true,
        description?: string,
        priceId?: string,
    ) {
        this.validate(value, currency);
        this._priceId = priceId || this.generateId();
        this._value = value;
        this._currency = currency.toUpperCase();
        this._isActive = isActive;
        this._description = description;
        this._recurringChargePeriod = recurringChargePeriod;
    }

    private validate(value: number, currency: string): void {
        if (value < 0) {
            throw new Error('Price value cannot be negative');
        }
        if (!currency || currency.trim().length !== 3) {
            throw new Error('Currency must be a 3-letter code (e.g., USD, EUR)');
        }
    }

    private generateId(): string {
        return `price_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    get priceId(): string {
        return this._priceId;
    }

    get value(): number {
        return this._value;
    }

    get currency(): string {
        return this._currency;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get description(): string | undefined {
        return this._description;
    }

    get recurringChargePeriod(): RecurringChargePeriod {
        return this._recurringChargePeriod;
    }

    /**
     * Get formatted price string
     */
    getFormattedPrice(): string {
        const amount = (this._value / 100).toFixed(2);
        return `${this._currency} ${amount}`;
    }

    equals(other: Price): boolean {
        return (
            this._value === other._value &&
            this._currency === other._currency &&
            this._recurringChargePeriod.equals(other._recurringChargePeriod)
        );
    }

    toJSON() {
        return {
            priceId: this._priceId,
            value: this._value,
            currency: this._currency,
            isActive: this._isActive,
            description: this._description,
            recurringChargePeriod: this._recurringChargePeriod.toJSON(),
        };
    }
}
