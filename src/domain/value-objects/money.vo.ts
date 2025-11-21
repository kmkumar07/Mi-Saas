export class Money {
    private readonly _amountCents: number;
    private readonly _currency: string;

    constructor(amountCents: number, currency: string = 'USD') {
        this.validate(amountCents, currency);
        this._amountCents = amountCents;
        this._currency = currency.toUpperCase();
    }

    private validate(amountCents: number, currency: string): void {
        if (amountCents < 0) {
            throw new Error('Amount cannot be negative');
        }

        if (!Number.isInteger(amountCents)) {
            throw new Error('Amount must be in cents (integer)');
        }

        if (currency.length !== 3) {
            throw new Error('Currency must be a 3-letter ISO code');
        }
    }

    get amountCents(): number {
        return this._amountCents;
    }

    get currency(): string {
        return this._currency;
    }

    get amountDollars(): number {
        return this._amountCents / 100;
    }

    add(other: Money): Money {
        this.ensureSameCurrency(other);
        return new Money(this._amountCents + other._amountCents, this._currency);
    }

    subtract(other: Money): Money {
        this.ensureSameCurrency(other);
        return new Money(this._amountCents - other._amountCents, this._currency);
    }

    multiply(factor: number): Money {
        return new Money(Math.round(this._amountCents * factor), this._currency);
    }

    equals(other: Money): boolean {
        return (
            this._amountCents === other._amountCents &&
            this._currency === other._currency
        );
    }

    private ensureSameCurrency(other: Money): void {
        if (this._currency !== other._currency) {
            throw new Error(
                `Cannot perform operation on different currencies: ${this._currency} and ${other._currency}`,
            );
        }
    }

    toString(): string {
        return `${this.amountDollars.toFixed(2)} ${this._currency}`;
    }
}
