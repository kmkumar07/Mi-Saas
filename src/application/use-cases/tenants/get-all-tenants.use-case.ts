import { Inject, Injectable } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '@domain/repositories';
import { Tenant } from '@domain/entities';
import { TenantResponseDto } from '../../dtos/tenant-response.dto';

@Injectable()
export class GetAllTenantsUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(): Promise<TenantResponseDto[]> {
        const tenants = await this.tenantRepository.findAll();
        return tenants.map(tenant => this.toResponseDto(tenant));
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

