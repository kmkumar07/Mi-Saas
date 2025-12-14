import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { IOAuthTokenRepository } from '../../../domain/repositories/oauth-token.repository.interface';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { IIdentityRepository } from '../../../domain/repositories/identity.repository.interface';
import { UserInfoResponseDto } from '../../dtos/oauth2/userinfo-response.dto';
import { JwtService } from '@nestjs/jwt';

/**
 * Get UserInfo Use Case
 * Returns user information based on the access token and requested scopes
 * Implements OpenID Connect UserInfo endpoint
 */
@Injectable()
export class GetUserInfoUseCase {
    constructor(
        @Inject('IOAuthTokenRepository')
        private readonly oauthTokenRepository: IOAuthTokenRepository,
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
        @Inject('IIdentityRepository')
        private readonly identityRepository: IIdentityRepository,
        private readonly jwtService: JwtService,
    ) {}

    async execute(accessToken: string): Promise<UserInfoResponseDto> {
        // 1. Validate access token (try JWT first, then database lookup)
        let tokenPayload: any;
        let oauthToken = null;

        try {
            // Try to verify as JWT
            tokenPayload = this.jwtService.verify(accessToken);
        } catch {
            // If JWT verification fails, try database lookup
            oauthToken = await this.oauthTokenRepository.findByAccessToken(accessToken);
            if (!oauthToken || !oauthToken.isValid()) {
                throw new UnauthorizedException('Invalid or expired access token');
            }
        }

        // 2. Get organization member ID
        let organizationMemberId: string;
        if (tokenPayload) {
            organizationMemberId = tokenPayload.sub;
        } else if (oauthToken) {
            organizationMemberId = oauthToken.organizationMemberId;
        } else {
            throw new UnauthorizedException('Invalid access token');
        }

        // 3. Get organization member
        const orgMember = await this.organizationMemberRepository.findById(organizationMemberId);
        if (!orgMember) {
            throw new NotFoundException('Organization member not found');
        }

        // 4. Get identity
        const identity = await this.identityRepository.findById(orgMember.identityId);
        if (!identity) {
            throw new NotFoundException('Identity not found');
        }

        // 5. Get scopes from token
        const scopes = tokenPayload?.scope
            ? tokenPayload.scope.split(' ')
            : oauthToken?.scope
            ? oauthToken.scope.split(' ')
            : [];

        // 6. Build user info response based on scopes
        const userInfo: UserInfoResponseDto = {
            sub: organizationMemberId,
        };

        // Always include sub (required by OIDC)

        // Include email if 'email' or 'profile' scope is present
        if (scopes.includes('email') || scopes.includes('profile') || scopes.includes('openid')) {
            userInfo.email = identity.email;
            userInfo.email_verified = true; // Assuming verified if they can login
        }

        // Include profile information if 'profile' or 'openid' scope is present
        if (scopes.includes('profile') || scopes.includes('openid')) {
            if (identity.firstName) {
                userInfo.given_name = identity.firstName;
            }
            if (identity.lastName) {
                userInfo.family_name = identity.lastName;
            }
            if (identity.firstName || identity.lastName) {
                userInfo.name = identity.fullName;
            }
        }

        // Include tenant_id if available
        userInfo.tenant_id = orgMember.tenantId;

        return userInfo;
    }
}

