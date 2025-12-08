import { Inject, Injectable } from '@nestjs/common';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { PlanFamily } from '@domain/entities';
import { PlanFamilyResponseDto } from '../../dtos/plan-family-response.dto';

@Injectable()
export class ListPlanFamiliesUseCase {
    constructor(
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
    ) { }

    async execute(): Promise<PlanFamilyResponseDto[]> {
        const planFamilies = await this.planFamilyRepository.findAll();

        return planFamilies.map(pf => this.toResponseDto(pf));
    }

    private toResponseDto(planFamily: PlanFamily): PlanFamilyResponseDto {
        return {
            id: planFamily.id,
            name: planFamily.name,
            planCode: planFamily.planCode,
            metadata: planFamily.metadata,
            createdAt: planFamily.createdAt,
            updatedAt: planFamily.updatedAt,
        };
    }
}

