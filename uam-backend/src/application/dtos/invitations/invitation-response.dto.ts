import { ApiProperty } from '@nestjs/swagger';

/**
 * Invitation Response DTO
 * Contains invitation information
 */
export class InvitationResponseDto {
    @ApiProperty({ description: 'Invitation ID' })
    id: string;

    @ApiProperty({ description: 'Tenant ID' })
    tenantId: string;

    @ApiProperty({ description: 'Invitee email' })
    email: string;

    @ApiProperty({ description: 'Invited by user ID', required: false })
    invitedBy?: string | null;

    @ApiProperty({ description: 'Invitation token' })
    invitationToken: string;

    @ApiProperty({ description: 'Role IDs', type: [String] })
    roleIds: string[];

    @ApiProperty({ description: 'Invitation status' })
    status: string;

    @ApiProperty({ description: 'Expiration timestamp' })
    expiresAt: Date;

    @ApiProperty({ description: 'Accepted timestamp', required: false })
    acceptedAt?: Date | null;

    @ApiProperty({ description: 'Created timestamp' })
    createdAt: Date;
}
