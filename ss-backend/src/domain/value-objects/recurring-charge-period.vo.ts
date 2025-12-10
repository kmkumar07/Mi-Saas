import { ChargeFrequency } from '../enums';

/**
 * RecurringChargePeriod Value Object
 * Defines how often a charge recurs for a subscription
 */
export class RecurringChargePeriod {
    private readonly _recurringChargePeriodId: string;
    private readonly _chargeFrequency: ChargeFrequency;
    private readonly _startDateTime: Date;
    private readonly _numberOfPeriods?: number;

    constructor(
        chargeFrequency: ChargeFrequency,
        startDateTime: Date,
        numberOfPeriods?: number,
        recurringChargePeriodId?: string,
    ) {
        this.validate(chargeFrequency, startDateTime, numberOfPeriods);
        this._recurringChargePeriodId = recurringChargePeriodId || this.generateId();
        this._chargeFrequency = chargeFrequency;
        this._startDateTime = startDateTime;
        this._numberOfPeriods = numberOfPeriods;
    }

    private validate(
        chargeFrequency: ChargeFrequency,
        startDateTime: Date,
        numberOfPeriods?: number,
    ): void {
        if (!Object.values(ChargeFrequency).includes(chargeFrequency)) {
            throw new Error('Invalid charge frequency');
        }
        if (!(startDateTime instanceof Date) || isNaN(startDateTime.getTime())) {
            throw new Error('Invalid start date time');
        }
        if (numberOfPeriods !== undefined && numberOfPeriods <= 0) {
            throw new Error('Number of periods must be positive');
        }
    }

    private generateId(): string {
        return `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    get recurringChargePeriodId(): string {
        return this._recurringChargePeriodId;
    }

    get chargeFrequency(): ChargeFrequency {
        return this._chargeFrequency;
    }

    get startDateTime(): Date {
        return this._startDateTime;
    }

    get numberOfPeriods(): number | undefined {
        return this._numberOfPeriods;
    }

    /**
     * Check if the recurring charge is unlimited (no end period)
     */
    isUnlimited(): boolean {
        return this._numberOfPeriods === undefined;
    }

    equals(other: RecurringChargePeriod): boolean {
        return (
            this._chargeFrequency === other._chargeFrequency &&
            this._startDateTime.getTime() === other._startDateTime.getTime() &&
            this._numberOfPeriods === other._numberOfPeriods
        );
    }

    toJSON() {
        return {
            recurringChargePeriodId: this._recurringChargePeriodId,
            chargeFrequency: this._chargeFrequency,
            startDateTime: this._startDateTime.toISOString(),
            numberOfPeriods: this._numberOfPeriods,
        };
    }
}
