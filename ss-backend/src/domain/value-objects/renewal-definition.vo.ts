import { TimePeriod } from './time-period.vo';

/**
 * RenewalDefinition Value Object
 * Defines renewal behavior for a subscription plan
 */
export class RenewalDefinition {
    private readonly _isExpirable: boolean;
    private readonly _isAutomaticRenewable: boolean;
    private readonly _renewCycleUnits: string;
    private readonly _gracePeriod: TimePeriod;
    private readonly _maxRenewCycles: number;

    constructor(
        isExpirable: boolean,
        isAutomaticRenewable: boolean,
        renewCycleUnits: string,
        gracePeriod: TimePeriod,
        maxRenewCycles: number,
    ) {
        this.validate(renewCycleUnits, maxRenewCycles);
        this._isExpirable = isExpirable;
        this._isAutomaticRenewable = isAutomaticRenewable;
        this._renewCycleUnits = renewCycleUnits;
        this._gracePeriod = gracePeriod;
        this._maxRenewCycles = maxRenewCycles;
    }

    private validate(renewCycleUnits: string, maxRenewCycles: number): void {
        if (!renewCycleUnits || renewCycleUnits.trim().length === 0) {
            throw new Error('Renew cycle units cannot be empty');
        }
        if (maxRenewCycles < 0) {
            throw new Error('Max renew cycles cannot be negative');
        }
    }

    get isExpirable(): boolean {
        return this._isExpirable;
    }

    get isAutomaticRenewable(): boolean {
        return this._isAutomaticRenewable;
    }

    get renewCycleUnits(): string {
        return this._renewCycleUnits;
    }

    get gracePeriod(): TimePeriod {
        return this._gracePeriod;
    }

    get maxRenewCycles(): number {
        return this._maxRenewCycles;
    }

    /**
     * Check if renewal is unlimited
     */
    isUnlimitedRenewal(): boolean {
        return !this._isExpirable && this._maxRenewCycles === 0;
    }

    equals(other: RenewalDefinition): boolean {
        return (
            this._isExpirable === other._isExpirable &&
            this._isAutomaticRenewable === other._isAutomaticRenewable &&
            this._renewCycleUnits === other._renewCycleUnits &&
            this._gracePeriod.equals(other._gracePeriod) &&
            this._maxRenewCycles === other._maxRenewCycles
        );
    }

    toJSON() {
        return {
            isExpirable: this._isExpirable,
            isAutomaticRenewable: this._isAutomaticRenewable,
            renewCycleUnits: this._renewCycleUnits,
            gracePeriod: this._gracePeriod.toJSON(),
            maxRenewCycles: this._maxRenewCycles,
        };
    }
}
