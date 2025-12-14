import { Inject, Injectable } from '@nestjs/common';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';

export interface UserFeaturePermission {
    featureId: string;
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
}

/**
 * Get User Product Permissions Use Case
 * Aggregates permissions for an organization member across all their roles for each feature.
 * 
 * UPDATED: Now uses organizationMemberId instead of userId
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 * 
 * Controller is responsible for joining this with product/feature metadata
 * from the SaaS backend.
 */
@Injectable()
export class GetUserProductPermissionsUseCase {
    constructor(
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
        @Inject('IRolePermissionRepository')
        private readonly rolePermissionRepository: IRolePermissionRepository,
    ) { }

    async execute(tenantId: string, organizationMemberId: string): Promise<UserFeaturePermission[]> {
        // 1. Load all roles for the organization member
        // RBAC subject is always organization_members.id, never identity.id
        const memberRoles = await this.memberRoleRepository.findByOrganizationMemberId(organizationMemberId);
        if (memberRoles.length === 0) {
            return [];
        }

        const roleIds = new Set(memberRoles.map(mr => mr.roleId));

        // 2. Load all permissions for this tenant
        const tenantPermissions = await this.rolePermissionRepository.findByTenantId(tenantId);

        // 3. Filter to permissions where the role is assigned to the member
        const memberPermissions = tenantPermissions.filter(p => roleIds.has(p.roleId));

        // 4. Aggregate by featureId (OR across all roles)
        const featureMap = new Map<string, UserFeaturePermission>();

        for (const perm of memberPermissions) {
            const existing = featureMap.get(perm.featureId);
            if (!existing) {
                featureMap.set(perm.featureId, {
                    featureId: perm.featureId,
                    canRead: perm.canRead,
                    canWrite: perm.canWrite,
                    canExecute: perm.canExecute,
                });
            } else {
                existing.canRead = existing.canRead || perm.canRead;
                existing.canWrite = existing.canWrite || perm.canWrite;
                existing.canExecute = existing.canExecute || perm.canExecute;
            }
        }

        return Array.from(featureMap.values());
    }
}


