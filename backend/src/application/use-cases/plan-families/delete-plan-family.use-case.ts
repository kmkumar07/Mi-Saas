import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories';

@Injectable()
export class DeletePlanFamilyUseCase {
    constructor(
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
    ) { }

    async execute(id: string): Promise<void> {
        // Check if plan family exists
        const planFamily = await this.planFamilyRepository.findById(id);
        if (!planFamily) {
            throw new NotFoundException(`Plan family with ID ${id} not found`);
        }

        // Check if there are any plans in this family
        // Note: This is a simplified check. In a real scenario, you might want to check
        // if there are active subscriptions or other constraints
        const plans = await this.planRepository.findByPlanFamilyId(id);
        if (plans.length > 0) {
            throw new BadRequestException(
                `Cannot delete plan family with ID ${id} because it has ${plans.length} plan(s) associated with it`,
            );
        }

        // Delete the plan family
        await this.planFamilyRepository.delete(id);
    }
}

