import { Injectable, Inject } from '@nestjs/common';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';
import { PermissionResponseDto } from '../../dtos/permissions/permission-response.dto';
import { PermissionMapper } from '../../mappers/permission.mapper';

/**
 * Get Role Permissions Use Case
 * Retrieves all permissions for a role
 */
@Injectable()
export class GetRolePermissionsUseCase {
    constructor(
        @Inject('IRolePermissionRepository')
        private readonly permissionRepository: IRolePermissionRepository,
    ) { }

    async execute(roleId: string): Promise<PermissionResponseDto[]> {
        const permissions = await this.permissionRepository.findByRoleId(roleId);
        return PermissionMapper.toResponseDtoArray(permissions);
    }
}
