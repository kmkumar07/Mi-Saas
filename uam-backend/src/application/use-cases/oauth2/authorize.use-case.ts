import { Injectable, Inject, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IOAuthClientRepository } from '../../../domain/repositories/oauth-client.repository.interface';
import { IOAuthAuthorizationCodeRepository } from '../../../domain/repositories/oauth-authorization-code.repository.interface';
import { OAuthAuthorizationCode } from '../../../domain/entities/oauth-authorization-code.entity';
import { AuthorizeRequestDto } from '../../dtos/oauth2/authorize-request.dto';
import * as crypto from 'crypto';

export interface AuthorizeResponse {
    code: string;
    state?: string;
}

/**
 * OAuth2 Authorize Use Case
 * Handles OAuth2 authorization request and generates authorization code
 * 
 * NOTE: This use case assumes the user is already authenticated.
 * The controller should handle authentication before calling this use case.
 */
@Injectable()
export class AuthorizeUseCase {
    constructor(
        @Inject('IOAuthClientRepository')
        private readonly oauthClientRepository: IOAuthClientRepository,
        @Inject('IOAuthAuthorizationCodeRepository')
        private readonly authCodeRepository: IOAuthAuthorizationCodeRepository,
    ) {}

    async execute(
        request: AuthorizeRequestDto,
        organizationMemberId: string,
        tenantId: string,
    ): Promise<AuthorizeResponse> {
        // 1. Validate client exists and is active
        const client = await this.oauthClientRepository.findByClientId(request.clientId);
        if (!client) {
            throw new NotFoundException('Invalid client ID');
        }

        if (!client.isActive) {
            throw new UnauthorizedException('Client is inactive');
        }

        // 2. Validate client belongs to the same tenant
        if (client.tenantId !== tenantId) {
            throw new UnauthorizedException('Client does not belong to this tenant');
        }

        // 3. Validate redirect URI
        if (!client.validateRedirectUri(request.redirectUri)) {
            throw new BadRequestException('Invalid redirect URI');
        }

        // 4. Validate response type
        if (request.responseType !== 'code') {
            throw new BadRequestException('Invalid response type. Only "code" is supported.');
        }

        // 5. Validate scopes (if provided)
        if (request.scope) {
            if (!client.validateScope(request.scope)) {
                throw new BadRequestException('Invalid scope');
            }
        }

        // 6. Generate authorization code
        const code = this.generateAuthorizationCode();

        // 7. Parse scopes
        const scopes = request.scope ? request.scope.split(' ').filter(s => s.length > 0) : [];

        // 8. Create authorization code (expires in 10 minutes)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const authCode = OAuthAuthorizationCode.create({
            code,
            clientId: request.clientId,
            organizationMemberId,
            redirectUri: request.redirectUri,
            scopes,
            expiresAt,
        });

        await this.authCodeRepository.create(authCode);

        return {
            code,
            state: request.state,
        };
    }

    private generateAuthorizationCode(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

