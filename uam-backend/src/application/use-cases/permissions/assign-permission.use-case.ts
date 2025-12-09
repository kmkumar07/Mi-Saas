import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { RolePermission } from '../../../domain/entities/role-permission.entity';
import { AssignPermissionDto } from '../../dtos/permissions/assign-permission.dto';
import { PermissionResponseDto } from '../../dtos/permissions/permission-response.dto';
import { PermissionMapper } from '../../mappers/permission.mapper';

/**
 * Assign Permission Use Case
 * Assigns a permission to a role
 */
@Injectable()
export class AssignPermissionUseCase {
    constructor(
        @Inject('IRolePermissionRepository')
        private readonly permissionRepository: IRolePermissionRepository,
        @Inject('ISystemRoleRepository')
        private readonly roleRepository: ISystemRoleRepository,
    ) { }

    async execute(roleId: string, dto: AssignPermissionDto): Promise<PermissionResponseDto> {
        // 1. Validate role exists
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        // 2. Check if permission already exists
        const existingPermission = await this.permissionRepository.findByRoleAndFeature(roleId, dto.featureId);
        if (existingPermission) {
            throw new ConflictException('Permission already assigned to role');
        }

        // 3. Create permission
        const permission = RolePermission.create({
            tenantId: role.tenantId,
            roleId,
            featureId: dto.featureId,
            canRead: dto.canRead,
            canWrite: dto.canWrite,
            canExecute: dto.canExecute,
        });

        const savedPermission = await this.permissionRepository.create(permission);
        return PermissionMapper.toResponseDto(savedPermission);
    }
}
