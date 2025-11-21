/**
 * TimePeriod Value Object
 * Represents a duration of time with a name and value
 */
export class TimePeriod {
    private readonly _timePeriodId: string;
    private readonly _name: string;
    private readonly _value: number;

    constructor(name: string, value: number, timePeriodId?: string) {
        this.validate(name, value);
        this._timePeriodId = timePeriodId || this.generateId();
        this._name = name;
        this._value = value;
    }

    private validate(name: string, value: number): void {
        if (!name || name.trim().length === 0) {
            throw new Error('Time period name cannot be empty');
        }
        if (value <= 0) {
            throw new Error('Time period value must be positive');
        }
    }

    private generateId(): string {
        return `tp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    get timePeriodId(): string {
        return this._timePeriodId;
    }

    get name(): string {
        return this._name;
    }

    get value(): number {
        return this._value;
    }

    /**
     * Get total duration in specified unit
     */
    getDurationInDays(): number {
        const conversions: Record<string, number> = {
            day: 1,
            week: 7,
            month: 30,
            year: 365,
        };
        return this._value * (conversions[this._name.toLowerCase()] || 1);
    }

    equals(other: TimePeriod): boolean {
        return (
            this._name === other._name &&
            this._value === other._value
        );
    }

    toJSON() {
        return {
            timePeriodId: this._timePeriodId,
            name: this._name,
            value: this._value,
        };
    }
}
