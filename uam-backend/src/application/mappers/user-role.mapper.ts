import { MemberRole } from '../../domain/entities/user-role.entity';
import { UserRoleResponseDto } from '../dtos/users/user-role-response.dto';

/**
 * Member Role Mapper
 * Maps MemberRole entity to UserRoleResponseDto
 * RENAMED from UserRoleMapper to reflect new permission model
 */
export class UserRoleMapper {
    static toResponseDto(memberRole: MemberRole): UserRoleResponseDto {
        const dto = new UserRoleResponseDto();
        dto.id = memberRole.id;
        dto.userId = memberRole.organizationMemberId; // Keep userId field for backward compatibility
        dto.roleId = memberRole.roleId;
        dto.productId = memberRole.productId ?? null;
        dto.assignedBy = memberRole.assignedBy;
        dto.assignedAt = memberRole.assignedAt;
        return dto;
    }

    static toResponseDtoArray(memberRoles: MemberRole[]): UserRoleResponseDto[] {
        return memberRoles.map(mr => this.toResponseDto(mr));
    }
}
