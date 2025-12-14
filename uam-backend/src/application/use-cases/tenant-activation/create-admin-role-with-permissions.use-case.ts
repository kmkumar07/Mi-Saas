import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { SystemRole } from '../../../domain/entities/system-role.entity';
import { RolePermission } from '../../../domain/entities/role-permission.entity';
import { MemberRole } from '../../../domain/entities/user-role.entity';

export interface CreateAdminRoleWithPermissionsInput {
    tenantId: string;
    organizationMemberId: string;
    roleCode: string;
    roleName: string;
    featureIds: string[];
}

export interface CreateAdminRoleWithPermissionsOutput {
    roleId: string;
    roleCode: string;
    permissionsCreated: number;
}

/**
 * Create Admin Role With Permissions Use Case
 * Creates a tenant-specific admin role with permissions for all provided features
 * and assigns it to the organization member.
 * 
 * This is idempotent - if role already exists, it will be reused.
 */
@Injectable()
export class CreateAdminRoleWithPermissionsUseCase {
    constructor(
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
        @Inject('IRolePermissionRepository')
        private readonly permissionRepository: IRolePermissionRepository,
        @Inject('IMemberRoleRepository')
        private readonly memberRoleRepository: IMemberRoleRepository,
    ) { }

    async execute(input: CreateAdminRoleWithPermissionsInput): Promise<CreateAdminRoleWithPermissionsOutput> {
        const { tenantId, organizationMemberId, roleCode, roleName, featureIds } = input;

        // 1. Check if role already exists (idempotency)
        let role = await this.roleRepository.findByCode(roleCode, tenantId);
        
        if (!role) {
            // 2. Create role entity
            role = SystemRole.create({
                tenantId,
                roleCode,
                roleName,
                description: `Admin role for plan activation`,
                isSystemRole: false,
                hierarchyLevel: 1, // Admin roles have high hierarchy
            });

            // 3. Persist role
            role = await this.roleRepository.create(role);
        }

        // 4. Check existing permissions for this role
        const existingPermissions = await this.permissionRepository.findByRoleId(role.id);
        const existingFeatureIds = new Set(existingPermissions.map(p => p.featureId));

        // 5. Create permissions for features that don't already exist
        let permissionsCreated = 0;
        for (const featureId of featureIds) {
            if (!existingFeatureIds.has(featureId)) {
                const permission = RolePermission.create({
                    tenantId,
                    roleId: role.id,
                    featureId,
                    canRead: true,
                    canWrite: true,
                    canExecute: true,
                });

                await this.permissionRepository.create(permission);
                permissionsCreated++;
            }
        }

        // 6. Check if role is already assigned to member (idempotency)
        const existingMemberRole = await this.memberRoleRepository.findByOrganizationMemberIdAndRoleId(
            organizationMemberId,
            role.id
        );

        if (!existingMemberRole) {
            // 7. Assign role to organization member
            const memberRole = MemberRole.create({
                organizationMemberId,
                roleId: role.id,
                assignedBy: organizationMemberId, // Self-assigned during activation
            });

            await this.memberRoleRepository.create(memberRole);
        }

        return {
            roleId: role.id,
            roleCode: role.roleCode,
            permissionsCreated,
        };
    }
}

