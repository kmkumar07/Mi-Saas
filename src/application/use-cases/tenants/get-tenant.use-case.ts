import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '@domain/repositories';
import { Tenant } from '@domain/entities';
import { TenantResponseDto } from '../../dtos/tenant-response.dto';

@Injectable()
export class GetTenantUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(id: string): Promise<TenantResponseDto> {
        const tenant = await this.tenantRepository.findById(id);

        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }

        return this.toResponseDto(tenant);
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
