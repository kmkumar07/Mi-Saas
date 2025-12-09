import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SendInvitationDto } from '../../application/dtos/invitations/send-invitation.dto';
import { AcceptInvitationDto } from '../../application/dtos/invitations/accept-invitation.dto';
import { InvitationResponseDto } from '../../application/dtos/invitations/invitation-response.dto';
import { UserResponseDto } from '../../application/dtos/users/user-response.dto';
import { ListInvitationsUseCase } from '../../application/use-cases/invitations/list-invitations.use-case';
import { SendInvitationUseCase } from '../../application/use-cases/invitations/send-invitation.use-case';
import { AcceptInvitationUseCase } from '../../application/use-cases/invitations/accept-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/use-cases/invitations/revoke-invitation.use-case';
import { AdminActivateInvitationUseCase } from '../../application/use-cases/invitations/admin-activate-invitation.use-case';

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
        private readonly adminActivateInvitationUseCase: AdminActivateInvitationUseCase,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Helper to extract tenantId from the JWT access token.
     */
    private extractTenantId(req: Request): string {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || Array.isArray(authHeader)) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new UnauthorizedException('Invalid Authorization header format');
        }

        const token = parts[1];
        const payload: any = this.jwtService.decode(token);

        if (!payload?.tenantId) {
            throw new UnauthorizedException('Tenant ID not found in token');
        }

        return payload.tenantId;
    }

    /**
     * Helper to extract userId (subject) from the JWT access token.
     */
    private extractUserId(req: Request): string {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || Array.isArray(authHeader)) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new UnauthorizedException('Invalid Authorization header format');
        }

        const token = parts[1];
        const payload: any = this.jwtService.decode(token);

        if (!payload?.sub) {
            throw new UnauthorizedException('User ID not found in token');
        }

        return payload.sub;
    }

    @Get()
    @ApiOperation({ summary: 'List all invitations for a tenant' })
    @ApiResponse({ status: 200, description: 'Invitations retrieved successfully', type: [InvitationResponseDto] })
    async listInvitations(@Req() req: Request): Promise<InvitationResponseDto[]> {
        const tenantId = this.extractTenantId(req);
        return this.listInvitationsUseCase.execute(tenantId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Send an invitation' })
    @ApiResponse({ status: 201, description: 'Invitation sent successfully', type: InvitationResponseDto })
    async sendInvitation(@Req() req: Request, @Body() dto: SendInvitationDto): Promise<InvitationResponseDto> {
        const tenantId = this.extractTenantId(req);
        const invitedBy = this.extractUserId(req);
        return this.sendInvitationUseCase.execute(tenantId, invitedBy, dto);
    }

    @Post(':id/activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Admin activates an invitation and creates the user with a password' })
    @ApiResponse({ status: 200, description: 'Invitation activated and user created', type: UserResponseDto })
    async activateInvitation(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() dto: AcceptInvitationDto,
    ): Promise<UserResponseDto> {
        const tenantId = this.extractTenantId(req);
        return this.adminActivateInvitationUseCase.execute(id, tenantId, dto);
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
