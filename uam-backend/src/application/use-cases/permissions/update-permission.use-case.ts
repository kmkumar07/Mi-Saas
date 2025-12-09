import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';
import { RolePermission } from '../../../domain/entities/role-permission.entity';
import { UpdatePermissionDto } from '../../dtos/permissions/update-permission.dto';
import { PermissionResponseDto } from '../../dtos/permissions/permission-response.dto';
import { PermissionMapper } from '../../mappers/permission.mapper';

/**
 * Update Permission Use Case
 * Updates permission flags
 */
@Injectable()
export class UpdatePermissionUseCase {
    constructor(
        @Inject('IRolePermissionRepository')
        private readonly permissionRepository: IRolePermissionRepository,
    ) { }

    async execute(permissionId: string, dto: UpdatePermissionDto): Promise<PermissionResponseDto> {
        // 1. Find permission
        const permission = await this.permissionRepository.findById(permissionId);
        if (!permission) {
            throw new NotFoundException(`Permission with ID ${permissionId} not found`);
        }

        // 2. Update permission entity
        // Recreating with updated props
        const updatedPermission = RolePermission.fromPersistence({
            id: permission.id,
            tenantId: permission.tenantId,
            roleId: permission.roleId,
            featureId: permission.featureId,
            canRead: dto.canRead !== undefined ? dto.canRead : permission.canRead,
            canWrite: dto.canWrite !== undefined ? dto.canWrite : permission.canWrite,
            canExecute: dto.canExecute !== undefined ? dto.canExecute : permission.canExecute,
            createdAt: permission.createdAt,
            updatedAt: new Date(),
        });

        // 3. Persist update
        const savedPermission = await this.permissionRepository.update(updatedPermission);
        return PermissionMapper.toResponseDto(savedPermission);
    }
}
