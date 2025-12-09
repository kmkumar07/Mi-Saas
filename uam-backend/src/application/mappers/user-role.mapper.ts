import { UserRole } from '../../domain/entities/user-role.entity';
import { UserRoleResponseDto } from '../dtos/users/user-role-response.dto';

/**
 * User Role Mapper
 * Maps UserRole entity to UserRoleResponseDto
 */
export class UserRoleMapper {
    static toResponseDto(userRole: UserRole): UserRoleResponseDto {
        const dto = new UserRoleResponseDto();
        dto.id = userRole.id;
        dto.userId = userRole.userId;
        dto.roleId = userRole.roleId;
        dto.assignedBy = userRole.assignedBy;
        dto.assignedAt = userRole.assignedAt;
        return dto;
    }

    static toResponseDtoArray(userRoles: UserRole[]): UserRoleResponseDto[] {
        return userRoles.map(ur => this.toResponseDto(ur));
    }
}
