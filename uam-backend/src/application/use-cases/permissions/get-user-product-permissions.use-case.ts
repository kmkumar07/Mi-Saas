import { Inject, Injectable } from '@nestjs/common';
import { IUserRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';

export interface UserFeaturePermission {
    featureId: string;
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
}

/**
 * Get User Product Permissions Use Case
 * Aggregates permissions for a user across all their roles for each feature.
 * Controller is responsible for joining this with product/feature metadata
 * from the SaaS backend.
 */
@Injectable()
export class GetUserProductPermissionsUseCase {
    constructor(
        @Inject('IUserRoleRepository')
        private readonly userRoleRepository: IUserRoleRepository,
        @Inject('IRolePermissionRepository')
        private readonly rolePermissionRepository: IRolePermissionRepository,
    ) { }

    async execute(tenantId: string, userId: string): Promise<UserFeaturePermission[]> {
        // 1. Load all roles for the user
        const userRoles = await this.userRoleRepository.findByUserId(userId);
        if (userRoles.length === 0) {
            return [];
        }

        const roleIds = new Set(userRoles.map(ur => ur.roleId));

        // 2. Load all permissions for this tenant
        const tenantPermissions = await this.rolePermissionRepository.findByTenantId(tenantId);

        // 3. Filter to permissions where the role is assigned to the user
        const userPermissions = tenantPermissions.filter(p => roleIds.has(p.roleId));

        // 4. Aggregate by featureId (OR across all roles)
        const featureMap = new Map<string, UserFeaturePermission>();

        for (const perm of userPermissions) {
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


