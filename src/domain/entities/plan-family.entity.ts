import { randomUUID } from 'crypto';
import { Plan, PlanProps } from './plan.entity';

export interface PlanFamilyProps {
    id?: string;
    tenantId: string;
    name: string;
    planCode: string;
    plans?: Plan[];
}

/**
 * Aggregate root representing a family of plan versions.
 *
 * Invariants and business rules about versioning and upgrades
 * are enforced here instead of in application services.
 */
export class PlanFamily {
    private readonly _id: string;
    private readonly _tenantId: string;
    private _name: string;
    private _planCode: string;
    private _plans: Plan[] = [];

    private constructor(props: PlanFamilyProps) {
        this._id = props.id ?? randomUUID();
        this._tenantId = props.tenantId;
        this._name = props.name;
        this._planCode = props.planCode;
        this._plans = props.plans ?? [];
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
            tenantId: initialPlan.tenantId,
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
            tenantId: base.tenantId,
            name: base.name,
            planCode: base.planCode,
            plans,
        });
    }

    get id(): string { return this._id; }
    get tenantId(): string { return this._tenantId; }
    get name(): string { return this._name; }
    get planCode(): string { return this._planCode; }
    get plans(): Plan[] { return [...this._plans]; }

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
     * - If there are active subscriptions, archive the latest plan and create a new version.
     * - Otherwise, apply updates directly to the latest plan.
     */
    updateLatestPlan(
        changes: Partial<PlanProps>,
        hasActiveSubscriptions: boolean,
    ): { originalPlan: Plan; updatedPlan: Plan } {
        const latest = this.latestPlan;

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

        // Directly apply updates to the existing latest plan
        latest.applyDirectUpdates(changes);

        return {
            originalPlan: latest,
            updatedPlan: latest,
        };
    }
}


