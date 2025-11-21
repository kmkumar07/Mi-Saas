import { Plan } from '../entities';

export interface IPlanRepository {
    create(plan: Plan): Promise<Plan>;
    findById(id: string): Promise<Plan | null>;
    findByTenantId(tenantId: string): Promise<Plan[]>;
    findByProductId(productId: string): Promise<Plan[]>;
    findAll(): Promise<Plan[]>;
    update(plan: Plan): Promise<Plan>;
    delete(id: string): Promise<void>;
}

export const PLAN_REPOSITORY = Symbol('IPlanRepository');
