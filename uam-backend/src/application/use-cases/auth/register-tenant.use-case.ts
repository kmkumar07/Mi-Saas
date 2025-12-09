import { Inject, Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../users/create-user.use-case';
import { RegisterTenantDto } from '../../dtos/auth/register-tenant.dto';
import { RegisterTenantResponseDto } from '../../dtos/auth/register-tenant-response.dto';
import {
    ITenantProvisioningClient,
    TENANT_PROVISIONING_CLIENT,
} from '../../../infrastructure/http/interfaces/tenant-provisioning.interface';

@Injectable()
export class RegisterTenantUseCase {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        @Inject(TENANT_PROVISIONING_CLIENT)
        private readonly tenantProvisioningClient: ITenantProvisioningClient,
    ) { }

    /**
     * Registers a new tenant in the main SaaS backend (public.tenants)
     * and creates the corresponding admin user in uam.users.
     */
    async execute(dto: RegisterTenantDto): Promise<RegisterTenantResponseDto> {
        const emailDomain = dto.email.split('@')[1] ?? undefined;

        const tenantName =
            dto.accountType === 'company'
                ? dto.companyName || dto.workspaceName || dto.email
                : dto.workspaceName || dto.firstName || dto.lastName || dto.email;

        // 1) Create tenant in main backend (public.tenants)
        const createdTenant = await this.tenantProvisioningClient.createTenant({
            name: tenantName,
            emailDomain,
            accountType: dto.accountType,
            workspaceName: dto.workspaceName,
            metadata: {
                accountType: dto.accountType,
                companyName: dto.companyName,
                workspaceName: dto.workspaceName,
            },
        });

        // 2) Create admin user in uam.users
        const adminUser = await this.createUserUseCase.execute(
            createdTenant.id,
            dto.email,
            dto.password,
            dto.firstName,
            dto.lastName,
            'local',
            dto.accountType,
        );

        return {
            tenantId: createdTenant.id,
            tenantName: createdTenant.name,
            accountType: dto.accountType,
            adminUser,
        };
    }
}


