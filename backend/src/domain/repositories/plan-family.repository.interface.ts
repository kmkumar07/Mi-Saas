import { PlanFamily } from '../entities';

export interface IPlanFamilyRepository {
    create(family: PlanFamily): Promise<PlanFamily>;
    findById(id: string): Promise<PlanFamily | null>;
    findByPlanCode(planCode: string): Promise<PlanFamily | null>;
    findAll(): Promise<PlanFamily[]>;
    update(family: PlanFamily): Promise<PlanFamily>;
    delete(id: string): Promise<void>;
}

export const PLAN_FAMILY_REPOSITORY = Symbol('IPlanFamilyRepository');

