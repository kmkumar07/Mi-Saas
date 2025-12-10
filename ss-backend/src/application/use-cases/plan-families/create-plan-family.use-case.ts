import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { PlanFamily } from '@domain/entities';
import { CreatePlanFamilyDto } from '../../dtos/create-plan-family.dto';
import { PlanFamilyResponseDto } from '../../dtos/plan-family-response.dto';

@Injectable()
export class CreatePlanFamilyUseCase {
    constructor(
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
    ) { }

    async execute(dto: CreatePlanFamilyDto): Promise<PlanFamilyResponseDto> {
        // Check if plan code already exists
        const existingFamily = await this.planFamilyRepository.findByPlanCode(
            dto.planCode,
        );
        if (existingFamily) {
            throw new BadRequestException(
                `Plan family with planCode '${dto.planCode}' already exists`,
            );
        }

        // Create domain entity
        const planFamily = PlanFamily.create({
            name: dto.name,
            planCode: dto.planCode,
            rank: dto.rank ?? 0,
            metadata: dto.metadata,
        });

        // Persist
        const savedPlanFamily = await this.planFamilyRepository.create(planFamily);

        // Map to response DTO
        return this.toResponseDto(savedPlanFamily);
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

