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

        // 2. For an edit screen, we want the submitted matrix to be the single source of truth.
        //    Simplest, most predictable behaviour: remove all existing permissions for the role,
        //    then recreate them from the incoming DTOs.
        await this.permissionRepository.deleteByRoleId(roleId);

        if (!permissions.length) {
            // No permissions submitted – return empty list.
            return [];
        }

        // 3. Create new permissions based on the submitted matrix
        const newPermissions = permissions.map(dto =>
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
        return PermissionMapper.toResponseDtoArray(savedPermissions);
    }
}
