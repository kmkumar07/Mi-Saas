import { randomUUID } from 'crypto';
import { Plan } from './plan.entity';

export interface SubscriptionProps {
    id?: string;
    accountId: string;
    tenantId: string;
    customerId: string;
    planId: string;
    status?: 'active' | 'trial' | 'past_due' | 'cancelled' | 'incomplete' | 'expired';
    seats?: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
}

export interface ProrationCalculation {
    currentPlanCost: number;
    newPlanCost: number;
    proratedCredit: number;
    amountDue: number;
    daysRemaining: number;
    daysInPeriod: number;
}

export class Subscription {
    private readonly _id: string;
    private readonly _accountId: string;
    private readonly _tenantId: string;
    private readonly _customerId: string;
    private _planId: string;
    private _status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'incomplete' | 'expired';
    private _seats: number;
    private _currentPeriodStart: Date;
    private _currentPeriodEnd: Date;
    private _cancelledAt?: Date;
    private _cancellationReason?: string;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;

    constructor(props: SubscriptionProps) {
        this.validate(props);

        this._id = props.id || randomUUID();
        this._accountId = props.accountId;
        this._tenantId = props.tenantId;
        this._customerId = props.customerId;
        this._planId = props.planId;
        this._status = props.status || 'active';
        this._seats = props.seats || 1;
        this._currentPeriodStart = props.currentPeriodStart;
        this._currentPeriodEnd = props.currentPeriodEnd;
        this._cancelledAt = props.cancelledAt;
        this._cancellationReason = props.cancellationReason;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt || new Date();
    }

    private validate(props: SubscriptionProps): void {
        if (!props.accountId || props.accountId.trim() === '') {
            throw new Error('Account ID is required');
        }

        if (!props.tenantId || props.tenantId.trim() === '') {
            throw new Error('Tenant ID is required');
        }

        if (!props.customerId || props.customerId.trim() === '') {
            throw new Error('Customer ID is required');
        }

        if (!props.planId || props.planId.trim() === '') {
            throw new Error('Plan ID is required');
        }

        if (!props.currentPeriodStart) {
            throw new Error('Current period start is required');
        }

        if (!props.currentPeriodEnd) {
            throw new Error('Current period end is required');
        }

        if (props.currentPeriodEnd <= props.currentPeriodStart) {
            throw new Error('Current period end must be after current period start');
        }

        if (props.seats && props.seats < 1) {
            throw new Error('Seats must be at least 1');
        }
    }

    // Getters
    get id(): string {
        return this._id;
    }

    get accountId(): string {
        return this._accountId;
    }

    get tenantId(): string {
        return this._tenantId;
    }

    get customerId(): string {
        return this._customerId;
    }

    get planId(): string {
        return this._planId;
    }

    get status(): 'active' | 'trial' | 'past_due' | 'cancelled' | 'incomplete' | 'expired' {
        return this._status;
    }

    get seats(): number {
        return this._seats;
    }

    get currentPeriodStart(): Date {
        return this._currentPeriodStart;
    }

    get currentPeriodEnd(): Date {
        return this._currentPeriodEnd;
    }

    get cancelledAt(): Date | undefined {
        return this._cancelledAt;
    }

    get cancellationReason(): string | undefined {
        return this._cancellationReason;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    // Business Rules
    canUpgradeToPlan(newPlan: Plan): boolean {
        if (this._status !== 'active' && this._status !== 'trial') {
            return false;
        }

        if (newPlan.id === this._planId) {
            return false; // Cannot upgrade to same plan
        }

        return true;
    }

    canDowngradeToPlan(newPlan: Plan, currentUsage?: Record<string, number>): boolean {
        if (this._status !== 'active' && this._status !== 'trial') {
            return false;
        }

        if (newPlan.id === this._planId) {
            return false; // Cannot downgrade to same plan
        }

        // TODO: Check if current usage exceeds new plan limits
        // This would require comparing currentUsage against newPlan features
        // For now, we allow downgrades

        return true;
    }

    /**
     * Calculate prorated amount for plan upgrade
     * 
     * Formula:
     * 1. Calculate days remaining in current period
     * 2. Calculate daily rate for current plan
     * 3. Calculate credit for unused time: (current plan cost / days in period) * days remaining
     * 4. Amount due = new plan cost - prorated credit
     * 
     * Example:
     * Current: $29/month, 10 days used, 20 days remaining
     * New: $99/month
     * Credit: ($29 / 30) * 20 = $19.33
     * Amount due: $99 - $19.33 = $79.67
     */
    calculateUpgradeAmount(currentPlan: Plan, newPlan: Plan): ProrationCalculation {
        const now = new Date();
        const periodStart = this._currentPeriodStart;
        const periodEnd = this._currentPeriodEnd;

        // Calculate days
        const totalPeriodMs = periodEnd.getTime() - periodStart.getTime();
        const daysInPeriod = Math.ceil(totalPeriodMs / (1000 * 60 * 60 * 24));

        const remainingMs = periodEnd.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

        // Get plan costs (in cents)
        const currentPlanCost = currentPlan.price.value;
        const newPlanCost = newPlan.price.value;

        // Calculate prorated credit
        const dailyRate = currentPlanCost / daysInPeriod;
        const proratedCredit = Math.floor(dailyRate * daysRemaining);

        // Calculate amount due
        const amountDue = Math.max(0, newPlanCost - proratedCredit);

        return {
            currentPlanCost,
            newPlanCost,
            proratedCredit,
            amountDue,
            daysRemaining,
            daysInPeriod,
        };
    }

    // State Management
    activate(): void {
        if (this._status === 'cancelled') {
            throw new Error('Cannot activate a cancelled subscription');
        }
        this._status = 'active';
    }

    suspend(): void {
        if (this._status === 'cancelled') {
            throw new Error('Cannot suspend a cancelled subscription');
        }
        this._status = 'past_due';
    }

    cancel(reason?: string): void {
        this._status = 'cancelled';
        this._cancelledAt = new Date();
        this._cancellationReason = reason;
    }

    renew(newPeriodStart: Date, newPeriodEnd: Date): void {
        if (this._status !== 'active') {
            throw new Error('Can only renew active subscriptions');
        }

        if (newPeriodEnd <= newPeriodStart) {
            throw new Error('Period end must be after period start');
        }

        this._currentPeriodStart = newPeriodStart;
        this._currentPeriodEnd = newPeriodEnd;
    }

    upgradeToPlan(newPlanId: string, newPeriodEnd: Date): void {
        if (!this.canUpgradeToPlan({ id: newPlanId } as Plan)) {
            throw new Error('Cannot upgrade to this plan');
        }

        this._planId = newPlanId;
        this._currentPeriodEnd = newPeriodEnd;
    }

    // Trial Management
    isInTrial(): boolean {
        return this._status === 'trial';
    }

    endTrial(): void {
        if (this._status !== 'trial') {
            throw new Error('Subscription is not in trial');
        }
        this._status = 'active';
    }

    // Status Checks
    isActive(): boolean {
        return this._status === 'active';
    }

    isCancelled(): boolean {
        return this._status === 'cancelled';
    }

    isPastDue(): boolean {
        return this._status === 'past_due';
    }

    isExpired(): boolean {
        return this._status === 'expired';
    }

    updateSeats(seats: number): void {
        if (seats < 1) {
            throw new Error('Seats must be at least 1');
        }
        this._seats = seats;
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
    }
}
