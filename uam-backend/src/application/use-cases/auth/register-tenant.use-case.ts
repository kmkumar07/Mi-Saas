import { Inject, Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../users/create-user.use-case';
import { CreateIdentityWithMembershipUseCase } from './create-identity-with-membership.use-case';
import { RegisterTenantDto } from '../../dtos/auth/register-tenant.dto';
import { RegisterTenantResponseDto } from '../../dtos/auth/register-tenant-response.dto';
import {
    ITenantProvisioningClient,
    TENANT_PROVISIONING_CLIENT,
} from '../../../infrastructure/http/interfaces/tenant-provisioning.interface';
import { IOrganizationAdminRepository } from '../../../domain/repositories/organization-admin.repository.interface';
import { OrganizationAdmin } from '../../../domain/entities/organization-admin.entity';

@Injectable()
export class RegisterTenantUseCase {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly createIdentityWithMembershipUseCase: CreateIdentityWithMembershipUseCase,
        @Inject(TENANT_PROVISIONING_CLIENT)
        private readonly tenantProvisioningClient: ITenantProvisioningClient,
        @Inject('IOrganizationAdminRepository')
        private readonly organizationAdminRepository: IOrganizationAdminRepository,
    ) { }

    /**
     * Registers a new tenant in the main SaaS backend (public.tenants)
     * and creates the corresponding admin user with full identity chain.
     * 
     * UPDATED: Now creates Identity → AuthenticationAccount → OrganizationMember → OrganizationAdmin
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

        // 2) Create identity chain: Identity → AuthenticationAccount → OrganizationMember
        const identityResult = await this.createIdentityWithMembershipUseCase.execute({
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
            tenantId: createdTenant.id,
            provider: 'local',
            isEmailVerified: false,
        });

        // 3) Create OrganizationAdmin for the admin user
        const existingAdmin = await this.organizationAdminRepository.existsByOrganizationMemberIdAndTenantId(
            identityResult.organizationMemberId,
            createdTenant.id,
        );

        if (!existingAdmin) {
            const orgAdmin = OrganizationAdmin.create({
                organizationMemberId: identityResult.organizationMemberId,
                tenantId: createdTenant.id,
                grantedBy: null, // Self-granted during registration
            });
            await this.organizationAdminRepository.create(orgAdmin);
        }

        // 4) Create admin user in uam.users (for backward compatibility)
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


