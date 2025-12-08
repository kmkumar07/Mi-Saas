import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import { ITenantRepository, TENANT_REPOSITORY } from '@domain/repositories';
import { PlanFamily } from '@domain/entities';
import { CreatePlanFamilyDto } from '../../dtos/create-plan-family.dto';
import { PlanFamilyResponseDto } from '../../dtos/plan-family-response.dto';

@Injectable()
export class CreatePlanFamilyUseCase {
    constructor(
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(dto: CreatePlanFamilyDto): Promise<PlanFamilyResponseDto> {
        // Validate tenant exists
        const tenant = await this.tenantRepository.findById(dto.tenantId);
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${dto.tenantId} not found`);
        }

        // Check if plan code already exists for this tenant
        const existingFamily = await this.planFamilyRepository.findByPlanCode(
            dto.tenantId,
            dto.planCode,
        );
        if (existingFamily) {
            throw new BadRequestException(
                `Plan family with planCode '${dto.planCode}' already exists for tenant ${dto.tenantId}`,
            );
        }

        // Create domain entity
        const planFamily = PlanFamily.create({
            tenantId: dto.tenantId,
            name: dto.name,
            planCode: dto.planCode,
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
            tenantId: planFamily.tenantId,
            name: planFamily.name,
            planCode: planFamily.planCode,
            metadata: planFamily.metadata,
            createdAt: planFamily.createdAt,
            updatedAt: planFamily.updatedAt,
        };
    }
}

