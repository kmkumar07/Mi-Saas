import { EmployeeInvitation } from '../../domain/entities/employee-invitation.entity';
import { InvitationResponseDto } from '../dtos/invitations/invitation-response.dto';

/**
 * Invitation Mapper
 * Maps EmployeeInvitation entity to InvitationResponseDto
 */
export class InvitationMapper {
    static toResponseDto(invitation: EmployeeInvitation): InvitationResponseDto {
        const dto = new InvitationResponseDto();
        dto.id = invitation.id;
        dto.tenantId = invitation.tenantId;
        dto.email = invitation.email;
        dto.invitedBy = invitation.invitedBy;
        dto.invitationToken = invitation.invitationToken;
        dto.roleIds = invitation.roleIds;
        dto.status = invitation.status;
        dto.expiresAt = invitation.expiresAt;
        dto.acceptedAt = invitation.acceptedAt;
        dto.createdAt = invitation.createdAt;
        return dto;
    }

    static toResponseDtoArray(invitations: EmployeeInvitation[]): InvitationResponseDto[] {
        return invitations.map(invitation => this.toResponseDto(invitation));
    }
}
