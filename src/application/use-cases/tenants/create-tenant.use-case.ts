import { Inject, Injectable } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '@domain/repositories';
import { Tenant } from '@domain/entities';
import { CreateTenantDto } from '../../dtos/create-tenant.dto';
import { TenantResponseDto } from '../../dtos/tenant-response.dto';

@Injectable()
export class CreateTenantUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(dto: CreateTenantDto): Promise<TenantResponseDto> {
        // Create domain entity
        const tenant = new Tenant({
            name: dto.name,
            emailDomain: dto.emailDomain,
            metadata: dto.metadata,
        });

        // Persist
        const savedTenant = await this.tenantRepository.create(tenant);

        // Map to response DTO
        return this.toResponseDto(savedTenant);
    }

    private toResponseDto(tenant: Tenant): TenantResponseDto {
        return {
            id: tenant.id!,
            name: tenant.name,
            emailDomain: tenant.emailDomain,
            metadata: tenant.metadata,
            createdAt: tenant.createdAt,
        };
    }
}
