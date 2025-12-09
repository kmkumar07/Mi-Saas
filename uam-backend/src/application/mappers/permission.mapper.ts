import { RolePermission } from '../../domain/entities/role-permission.entity';
import { PermissionResponseDto } from '../dtos/permissions/permission-response.dto';

/**
 * Permission Mapper
 * Maps RolePermission entity to PermissionResponseDto
 */
export class PermissionMapper {
    static toResponseDto(permission: RolePermission): PermissionResponseDto {
        const dto = new PermissionResponseDto();
        dto.id = permission.id;
        dto.roleId = permission.roleId;
        dto.featureId = permission.featureId;
        dto.canRead = permission.canRead;
        dto.canWrite = permission.canWrite;
        dto.canExecute = permission.canExecute;
        dto.createdAt = permission.createdAt;
        dto.updatedAt = permission.updatedAt;
        return dto;
    }

    static toResponseDtoArray(permissions: RolePermission[]): PermissionResponseDto[] {
        return permissions.map(permission => this.toResponseDto(permission));
    }
}
