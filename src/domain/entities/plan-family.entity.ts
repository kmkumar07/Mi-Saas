import { randomUUID } from 'crypto';
import { Plan, PlanProps } from './plan.entity';

export interface PlanFamilyProps {
    id?: string;
    name: string;
    planCode: string;
    rank?: number;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
    plans?: Plan[];
}

/**
 * Entity representing a family of plan versions.
 * 
 * PlanFamily is now a first-class entity that can be persisted independently.
 * It groups related plan versions together via the planCode.
 *
 * Invariants and business rules about versioning and upgrades
 * are enforced here instead of in application services.
 */
export class PlanFamily {
    private readonly _id: string;
    private _name: string;
    private _planCode: string;
    private _rank: number;
    private _metadata?: Record<string, any>;
    private readonly _createdAt: Date;
    private _updatedAt: Date;
    private _plans: Plan[] = [];

    private constructor(props: PlanFamilyProps) {
        this._id = props.id ?? randomUUID();
        this._name = props.name;
        this._planCode = props.planCode;
        this._rank = props.rank ?? 0;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
        this._plans = props.plans ?? [];
    }

    /**
     * Creates a new PlanFamily entity (without plans).
     * Plans should be added separately.
     */
    static create(props: Omit<PlanFamilyProps, 'plans'>): PlanFamily {
        return new PlanFamily(props);
    }

    /**
     * Creates a new family with a single initial plan (version 1).
     */
    static createInitialPlan(props: PlanProps): PlanFamily {
        const initialPlan = new Plan({
            ...props,
            version: props.version ?? 1,
        });

        return new PlanFamily({
            name: initialPlan.name,
            planCode: initialPlan.planCode,
            plans: [initialPlan],
        });
    }

    /**
     * Builds a PlanFamily from existing plans (e.g. loaded from persistence).
     * At least one plan is required.
     */
    static fromPlans(plans: Plan[]): PlanFamily {
        if (!plans || plans.length === 0) {
            throw new Error('PlanFamily must contain at least one plan');
        }

        const base = plans[0];
        return new PlanFamily({
            name: base.name,
            planCode: base.planCode,
            plans,
        });
    }

    get id(): string { return this._id; }
    get name(): string { return this._name; }
    get planCode(): string { return this._planCode; }
    get rank(): number { return this._rank; }
    get metadata(): Record<string, any> | undefined { return this._metadata; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }
    get plans(): Plan[] { return [...this._plans]; }

    /**
     * Updates the family name
     */
    updateName(newName: string): void {
        if (!newName || newName.trim() === '') {
            throw new Error('Plan family name cannot be empty');
        }
        this._name = newName;
        this._updatedAt = new Date();
    }

    /**
     * Updates the plan code
     */
    updatePlanCode(newPlanCode: string): void {
        if (!newPlanCode || newPlanCode.trim() === '') {
            throw new Error('Plan code cannot be empty');
        }
        this._planCode = newPlanCode;
        this._updatedAt = new Date();
    }

    /**
     * Updates metadata
     */
    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
        this._updatedAt = new Date();
    }

    /**
     * Updates the rank
     */
    updateRank(newRank: number): void {
        if (newRank < 0) {
            throw new Error('Rank cannot be negative');
        }
        this._rank = newRank;
        this._updatedAt = new Date();
    }

    /**
     * Checks if this plan family has a higher rank than another
     */
    isHigherRankThan(other: PlanFamily): boolean {
        return this._rank > other.rank;
    }

    /**
     * Converts entity to props for persistence
     */
    toProps(): PlanFamilyProps {
        return {
            id: this._id,
            name: this._name,
            planCode: this._planCode,
            rank: this._rank,
            metadata: this._metadata,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            plans: this._plans,
        };
    }

    /**
     * The latest plan version in this family (highest version number).
     */
    get latestPlan(): Plan {
        if (this._plans.length === 0) {
            throw new Error('PlanFamily has no plans');
        }

        return this._plans.reduce((latest, current) =>
            current.version > latest.version ? current : latest,
        );
    }

    getPlan(version: number): Plan {
        const found = this._plans.find(p => p.version === version);
        if (!found) {
            throw new Error(`Plan version ${version} not found`);
        }
        return found;
    }

    archiveVersion(version: number): void {
        const plan = this.getPlan(version);
        plan.archive();
    }

    /**
     * Updates the latest plan according to business rules:
     * - If the plan is published (immutable), always create a new version.
     * - If there are active subscriptions, archive the latest plan and create a new version.
     * - Otherwise, apply updates directly to the latest plan.
     */
    updateLatestPlan(
        changes: Partial<PlanProps>,
        hasActiveSubscriptions: boolean,
    ): { originalPlan: Plan; updatedPlan: Plan } {
        const latest = this.latestPlan;

        // Published plans are immutable - always create new version
        if (latest.isPublished) {
            // Archive the original plan (if not already archived)
            if (latest.status !== 'archived') {
                latest.archive();
            }

            // Create a new plan version (will also be published)
            const newVersion = latest.createNewVersion(changes);
            this._plans.push(newVersion);

            return {
                originalPlan: latest,
                updatedPlan: newVersion,
            };
        }

        if (hasActiveSubscriptions) {
            // Archive the original plan
            latest.archive();

            // Create a new plan version
            const newVersion = latest.createNewVersion(changes);
            this._plans.push(newVersion);

            return {
                originalPlan: latest,
                updatedPlan: newVersion,
            };
        }

        // Directly apply updates to the existing latest plan (only for draft/active plans without subscriptions)
        latest.applyDirectUpdates(changes);

        return {
            originalPlan: latest,
            updatedPlan: latest,
        };
    }
}


