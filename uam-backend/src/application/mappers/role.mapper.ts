import { SystemRole } from '../../domain/entities/system-role.entity';
import { RoleResponseDto } from '../dtos/roles/role-response.dto';

/**
 * Role Mapper
 * Maps SystemRole entity to RoleResponseDto
 */
export class RoleMapper {
    static toResponseDto(role: SystemRole): RoleResponseDto {
        const dto = new RoleResponseDto();
        dto.id = role.id;
        dto.tenantId = role.tenantId;
        dto.roleCode = role.roleCode;
        dto.roleName = role.roleName;
        dto.description = role.description;
        dto.isSystemRole = role.isSystemRole;
        dto.hierarchyLevel = role.hierarchyLevel;
        dto.createdAt = role.createdAt;
        dto.updatedAt = role.updatedAt;
        return dto;
    }

    static toResponseDtoArray(roles: SystemRole[]): RoleResponseDto[] {
        return roles.map(role => this.toResponseDto(role));
    }
}
