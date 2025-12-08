import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { PlanFamily } from '@domain/entities';
import { UpdatePlanFamilyDto } from '../../dtos/update-plan-family.dto';
import { PlanFamilyResponseDto } from '../../dtos/plan-family-response.dto';

@Injectable()
export class UpdatePlanFamilyUseCase {
    constructor(
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
    ) { }

    async execute(id: string, dto: UpdatePlanFamilyDto): Promise<PlanFamilyResponseDto> {
        // Load existing plan family
        const planFamily = await this.planFamilyRepository.findById(id);
        if (!planFamily) {
            throw new NotFoundException(`Plan family with ID ${id} not found`);
        }

        // Update fields if provided
        if (dto.name !== undefined) {
            planFamily.updateName(dto.name);
        }

        if (dto.planCode !== undefined) {
            // Check if new plan code already exists
            const existingFamily = await this.planFamilyRepository.findByPlanCode(dto.planCode);
            if (existingFamily && existingFamily.id !== id) {
                throw new BadRequestException(
                    `Plan family with planCode '${dto.planCode}' already exists`,
                );
            }
            planFamily.updatePlanCode(dto.planCode);
        }

        if (dto.metadata !== undefined) {
            planFamily.updateMetadata(dto.metadata);
        }

        // Persist changes
        const updatedPlanFamily = await this.planFamilyRepository.update(planFamily);

        // Map to response DTO
        return this.toResponseDto(updatedPlanFamily);
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

