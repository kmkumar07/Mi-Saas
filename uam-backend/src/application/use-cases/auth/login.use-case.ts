import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenResponseDto } from '../../dtos/auth/token-response.dto';
import { JwtService } from '@nestjs/jwt';
import { ResolveIdentityUseCase } from './resolve-identity.use-case';

/**
 * Login Use Case
 * Handles user authentication and token generation
 * 
 * UPDATED: Now uses new authentication resolution flow:
 * auth_account → identity → organization_members → JWT with organizationMemberId
 * 
 * CRITICAL: JWT sub claim is now organization_members.id (tenant-scoped), not user.id
 */
@Injectable()
export class LoginUseCase {
    constructor(
        private readonly resolveIdentityUseCase: ResolveIdentityUseCase,
        private readonly jwtService: JwtService,
    ) { }

    async execute(email: string, password: string, tenantId: string): Promise<TokenResponseDto> {
        // Resolve authentication: auth_account → identity → organization_members
        const resolved = await this.resolveIdentityUseCase.execute(email, password, tenantId);

        // Generate tokens with organizationMemberId as sub claim
        // This is tenant-scoped and represents the membership, not the global identity
        const payload = {
            sub: resolved.organizationMemberId, // JWT sub = organization_members.id
            identityId: resolved.identityId, // Include identityId for reference
            email: resolved.email,
            tenantId: resolved.tenantId,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return new TokenResponseDto(accessToken, refreshToken, 900); // 15 minutes
    }
}
