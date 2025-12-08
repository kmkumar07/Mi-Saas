import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { PlanFamily } from '@domain/entities';
import { PlanFamilyResponseDto } from '../../dtos/plan-family-response.dto';

@Injectable()
export class GetPlanFamilyUseCase {
    constructor(
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
    ) { }

    async execute(id: string): Promise<PlanFamilyResponseDto> {
        const planFamily = await this.planFamilyRepository.findById(id);

        if (!planFamily) {
            throw new NotFoundException(`Plan family with ID ${id} not found`);
        }

        return this.toResponseDto(planFamily);
    }

    private toResponseDto(planFamily: PlanFamily): PlanFamilyResponseDto {
        return {
            id: planFamily.id,
            name: planFamily.name,
            planCode: planFamily.planCode,
            rank: planFamily.rank,
            metadata: planFamily.metadata,
            createdAt: planFamily.createdAt,
            updatedAt: planFamily.updatedAt,
        };
    }
}

