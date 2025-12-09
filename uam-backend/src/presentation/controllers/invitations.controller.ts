import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SendInvitationDto } from '../../application/dtos/invitations/send-invitation.dto';
import { AcceptInvitationDto } from '../../application/dtos/invitations/accept-invitation.dto';
import { InvitationResponseDto } from '../../application/dtos/invitations/invitation-response.dto';
import { UserResponseDto } from '../../application/dtos/users/user-response.dto';
import { ListInvitationsUseCase } from '../../application/use-cases/invitations/list-invitations.use-case';
import { SendInvitationUseCase } from '../../application/use-cases/invitations/send-invitation.use-case';
import { AcceptInvitationUseCase } from '../../application/use-cases/invitations/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/use-cases/invitations/revoke-invitation.use-case';

/**
 * Invitations Controller
 * Handles invitation management endpoints
 */
@ApiTags('Invitations')
@Controller('api/invitations')
export class InvitationsController {
    constructor(
        private readonly listInvitationsUseCase: ListInvitationsUseCase,
        private readonly sendInvitationUseCase: SendInvitationUseCase,
        private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
        private readonly revokeInvitationUseCase: RevokeInvitationUseCase,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List all invitations for a tenant' })
    @ApiResponse({ status: 200, description: 'Invitations retrieved successfully', type: [InvitationResponseDto] })
    async listInvitations(): Promise<InvitationResponseDto[]> {
        // Hardcoded tenantId for now
        const tenantId = '00000000-0000-0000-0000-000000000001';
        return this.listInvitationsUseCase.execute(tenantId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Send an invitation' })
    @ApiResponse({ status: 201, description: 'Invitation sent successfully', type: InvitationResponseDto })
    async sendInvitation(@Body() dto: SendInvitationDto): Promise<InvitationResponseDto> {
        // Hardcoded tenantId and userId for now
        const tenantId = '00000000-0000-0000-0000-000000000001';
        const invitedBy = '00000000-0000-0000-0000-000000000000'; // System admin
        return this.sendInvitationUseCase.execute(tenantId, invitedBy, dto);
    }

    @Post(':token/accept')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Accept an invitation' })
    @ApiResponse({ status: 200, description: 'Invitation accepted successfully', type: UserResponseDto })
    async acceptInvitation(
        @Param('token') token: string,
        @Body() dto: AcceptInvitationDto,
    ): Promise<UserResponseDto> {
        return this.acceptInvitationUseCase.execute(token, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revoke an invitation' })
    @ApiResponse({ status: 204, description: 'Invitation revoked successfully' })
    async revokeInvitation(@Param('id') id: string): Promise<void> {
        await this.revokeInvitationUseCase.execute(id);
    }
}
