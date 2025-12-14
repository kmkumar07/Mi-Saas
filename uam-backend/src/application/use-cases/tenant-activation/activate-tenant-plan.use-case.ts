import { Injectable } from '@nestjs/common';
import { GetOrganizationAdminUseCase } from './get-organization-admin.use-case';
import { CreateAdminRoleWithPermissionsUseCase } from './create-admin-role-with-permissions.use-case';
import { SyncProductAccessUseCase } from './sync-product-access.use-case';

export interface ActivateTenantPlanInput {
    tenantId: string;
    productIds: string[];
    featureIds: string[];
    roleCode: string;
    roleName: string;
}

export interface ActivateTenantPlanOutput {
    success: boolean;
    organizationMemberId: string;
    roleId: string;
    roleCode: string;
    permissionsCreated: number;
    grantsCreated: number;
    grantsSkipped: number;
}

/**
 * Activate Tenant Plan Use Case
 * Orchestrates the complete tenant activation process:
 * 1. Gets organization admin for tenant
 * 2. Creates admin role with permissions for all features
 * 3. Syncs product access grants for all products
 * 
 * This is idempotent - can be called multiple times safely.
 */
@Injectable()
export class ActivateTenantPlanUseCase {
    constructor(
        private readonly getOrganizationAdminUseCase: GetOrganizationAdminUseCase,
        private readonly createAdminRoleWithPermissionsUseCase: CreateAdminRoleWithPermissionsUseCase,
        private readonly syncProductAccessUseCase: SyncProductAccessUseCase,
    ) { }

    async execute(input: ActivateTenantPlanInput): Promise<ActivateTenantPlanOutput> {
        const { tenantId, productIds, featureIds, roleCode, roleName } = input;

        // 1. Get organization admin for tenant
        const orgAdmin = await this.getOrganizationAdminUseCase.execute({ tenantId });

        // 2. Create admin role with permissions (idempotent)
        const roleResult = await this.createAdminRoleWithPermissionsUseCase.execute({
            tenantId,
            organizationMemberId: orgAdmin.organizationMemberId,
            roleCode,
            roleName,
            featureIds,
        });

        // 3. Sync product access (idempotent)
        const productAccessResult = await this.syncProductAccessUseCase.execute({
            tenantId,
            organizationMemberId: orgAdmin.organizationMemberId,
            productIds,
        });

        return {
            success: true,
            organizationMemberId: orgAdmin.organizationMemberId,
            roleId: roleResult.roleId,
            roleCode: roleResult.roleCode,
            permissionsCreated: roleResult.permissionsCreated,
            grantsCreated: productAccessResult.grantsCreated,
            grantsSkipped: productAccessResult.grantsSkipped,
        };
    }
}

