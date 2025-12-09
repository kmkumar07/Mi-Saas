import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { RolePermission } from '../../../domain/entities/role-permission.entity';
import { AssignPermissionDto } from '../../dtos/permissions/assign-permission.dto';
import { PermissionResponseDto } from '../../dtos/permissions/permission-response.dto';
import { PermissionMapper } from '../../mappers/permission.mapper';

/**
 * Bulk Assign Permissions Use Case
 * Assigns multiple permissions to a role
 */
@Injectable()
export class BulkAssignPermissionsUseCase {
    constructor(
        @Inject('IRolePermissionRepository')
        private readonly permissionRepository: IRolePermissionRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(roleId: string, permissions: AssignPermissionDto[]): Promise<PermissionResponseDto[]> {
        // 1. Validate role exists
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // 2. Get existing permissions to avoid duplicates
        const existingPermissions = await this.permissionRepository.findByRoleId(roleId);
        const existingFeatureIds = new Set(existingPermissions.map(p => p.featureId));

        // 3. Filter out duplicates
        const newPermissionsData = permissions.filter(p => !existingFeatureIds.has(p.featureId));

        if (newPermissionsData.length === 0) {
            return PermissionMapper.toResponseDtoArray(existingPermissions);
        }

        // 4. Create new permissions
        const newPermissions = newPermissionsData.map(dto =>
            RolePermission.create({
                tenantId: role.tenantId,
                roleId,
                featureId: dto.featureId,
                canRead: dto.canRead,
                canWrite: dto.canWrite,
                canExecute: dto.canExecute,
            })
        );

        const savedPermissions = await this.permissionRepository.bulkCreate(newPermissions);

        // Return all permissions (existing + new)
        const allPermissions = [...existingPermissions, ...savedPermissions];
        return PermissionMapper.toResponseDtoArray(allPermissions);
    }
}
