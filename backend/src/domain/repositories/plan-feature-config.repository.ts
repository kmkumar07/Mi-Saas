import { PlanFeatureConfig } from '../entities/plan-feature-config.entity';

export interface IPlanFeatureConfigRepository {
    /**
     * Finds all plan feature configurations for the given plan IDs.
     */
    findByPlanIds(planIds: string[]): Promise<PlanFeatureConfig[]>;
}

export const PLAN_FEATURE_CONFIG_REPOSITORY = Symbol('PLAN_FEATURE_CONFIG_REPOSITORY');


