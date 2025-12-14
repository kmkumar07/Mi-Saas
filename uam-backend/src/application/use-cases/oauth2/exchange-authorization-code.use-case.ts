import { Injectable, Inject, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IOAuthClientRepository } from '../../../domain/repositories/oauth-client.repository.interface';
import { IOAuthAuthorizationCodeRepository } from '../../../domain/repositories/oauth-authorization-code.repository.interface';
import { IOAuthTokenRepository } from '../../../domain/repositories/oauth-token.repository.interface';
import { OAuthToken } from '../../../domain/entities/oauth-token.entity';
import { Password } from '../../../domain/value-objects/password.value-object';
import { OAuth2TokenResponseDto } from '../../dtos/oauth2/token-response.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface ExchangeAuthorizationCodeInput {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
}

/**
 * Exchange Authorization Code Use Case
 * Exchanges an authorization code for access and refresh tokens
 */
@Injectable()
export class ExchangeAuthorizationCodeUseCase {
    constructor(
        @Inject('IOAuthClientRepository')
        private readonly oauthClientRepository: IOAuthClientRepository,
        @Inject('IOAuthAuthorizationCodeRepository')
        private readonly authCodeRepository: IOAuthAuthorizationCodeRepository,
        @Inject('IOAuthTokenRepository')
        private readonly oauthTokenRepository: IOAuthTokenRepository,
        private readonly jwtService: JwtService,
    ) {}

    async execute(input: ExchangeAuthorizationCodeInput): Promise<OAuth2TokenResponseDto> {
        // 1. Validate client
        const client = await this.oauthClientRepository.findByClientId(input.clientId);
        if (!client) {
            throw new NotFoundException('Invalid client ID');
        }

        if (!client.isActive) {
            throw new UnauthorizedException('Client is inactive');
        }

        // 2. Validate client secret
        const passwordObj = Password.fromHash(client.clientSecretHash);
        const isValidSecret = await passwordObj.compare(input.clientSecret);
        if (!isValidSecret) {
            throw new UnauthorizedException('Invalid client credentials');
        }

        // 3. Find and validate authorization code
        const authCode = await this.authCodeRepository.findByCode(input.code);
        if (!authCode) {
            throw new NotFoundException('Invalid authorization code');
        }

        if (!authCode.isValid()) {
            throw new BadRequestException('Authorization code has expired');
        }

        // 4. Validate client matches
        if (authCode.clientId !== input.clientId) {
            throw new BadRequestException('Authorization code does not match client');
        }

        // 5. Validate redirect URI matches
        if (authCode.redirectUri !== input.redirectUri) {
            throw new BadRequestException('Redirect URI does not match');
        }

        // 6. Generate access token (JWT)
        const accessTokenPayload = {
            sub: authCode.organizationMemberId,
            clientId: input.clientId,
            scope: authCode.scopes.join(' '),
        };
        const accessToken = this.jwtService.sign(accessTokenPayload, { expiresIn: '15m' });

        // 7. Generate refresh token (random string)
        const refreshToken = crypto.randomBytes(32).toString('hex');

        // 8. Calculate expiration times
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

        const refreshExpiresAt = new Date();
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

        // 9. Store OAuth token
        const oauthToken = OAuthToken.create({
            organizationMemberId: authCode.organizationMemberId,
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresAt,
            refreshExpiresAt,
            scope: authCode.scopes.join(' '),
        });
        await this.oauthTokenRepository.create(oauthToken);

        // 10. Delete authorization code (single-use)
        await this.authCodeRepository.deleteByCode(input.code);

        return new OAuth2TokenResponseDto(
            accessToken,
            'Bearer',
            900, // 15 minutes in seconds
            refreshToken,
            authCode.scopes.join(' '),
        );
    }
}

