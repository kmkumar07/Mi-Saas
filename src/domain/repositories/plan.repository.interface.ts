import { Plan } from '../entities';

export interface IPlanRepository {
    create(plan: Plan): Promise<Plan>;
    findById(id: string): Promise<Plan | null>;
    findByProductId(productId: string): Promise<Plan[]>;
    findByPlanFamilyId(planFamilyId: string): Promise<Plan[]>;
    findLatestByPlanFamilyId(planFamilyId: string): Promise<Plan | null>;
    findByPlanFamilyIdAndVersion(planFamilyId: string, version: number): Promise<Plan | null>;
    findAll(): Promise<Plan[]>;
    update(plan: Plan): Promise<Plan>;
    delete(id: string): Promise<void>;
}

export const PLAN_REPOSITORY = Symbol('IPlanRepository');
