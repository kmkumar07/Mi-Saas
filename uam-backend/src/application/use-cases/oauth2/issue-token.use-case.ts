import { Injectable, Inject, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenRequestDto } from '../../dtos/oauth2/token-request.dto';
import { OAuth2TokenResponseDto } from '../../dtos/oauth2/token-response.dto';
import { IOAuthClientRepository } from '../../../domain/repositories/oauth-client.repository.interface';
import { IOAuthAuthorizationCodeRepository } from '../../../domain/repositories/oauth-authorization-code.repository.interface';
import { IOAuthTokenRepository } from '../../../domain/repositories/oauth-token.repository.interface';
import { ExchangeAuthorizationCodeUseCase } from './exchange-authorization-code.use-case';
import { Password } from '../../../domain/value-objects/password.value-object';
import { OAuthToken } from '../../../domain/entities/oauth-token.entity';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

/**
 * Issue Token Use Case
 * Handles multiple OAuth2 grant types:
 * - authorization_code: Exchange code for token
 * - client_credentials: Issue token for service-to-service
 * - refresh_token: Issue new access token from refresh token
 */
@Injectable()
export class IssueTokenUseCase {
    constructor(
        @Inject('IOAuthClientRepository')
        private readonly oauthClientRepository: IOAuthClientRepository,
        @Inject('IOAuthTokenRepository')
        private readonly oauthTokenRepository: IOAuthTokenRepository,
        private readonly exchangeAuthorizationCodeUseCase: ExchangeAuthorizationCodeUseCase,
        private readonly jwtService: JwtService,
    ) {}

    async execute(
        request: TokenRequestDto,
        tenantId?: string,
    ): Promise<OAuth2TokenResponseDto> {
        switch (request.grantType) {
            case 'authorization_code':
                return this.handleAuthorizationCode(request);
            case 'client_credentials':
                return this.handleClientCredentials(request, tenantId!);
            case 'refresh_token':
                return this.handleRefreshToken(request);
            default:
                throw new BadRequestException(`Unsupported grant type: ${request.grantType}`);
        }
    }

    private async handleAuthorizationCode(request: TokenRequestDto): Promise<OAuth2TokenResponseDto> {
        if (!request.code || !request.redirectUri || !request.clientId || !request.clientSecret) {
            throw new BadRequestException('Missing required parameters for authorization_code grant');
        }

        return this.exchangeAuthorizationCodeUseCase.execute({
            code: request.code,
            redirectUri: request.redirectUri,
            clientId: request.clientId,
            clientSecret: request.clientSecret,
        });
    }

    private async handleClientCredentials(
        request: TokenRequestDto,
        tenantId: string,
    ): Promise<OAuth2TokenResponseDto> {
        if (!request.clientId || !request.clientSecret) {
            throw new BadRequestException('Missing client credentials');
        }

        // Validate client
        const client = await this.oauthClientRepository.findByClientId(request.clientId);
        if (!client) {
            throw new NotFoundException('Invalid client ID');
        }

        if (!client.isActive) {
            throw new UnauthorizedException('Client is inactive');
        }

        if (client.tenantId !== tenantId) {
            throw new UnauthorizedException('Client does not belong to this tenant');
        }

        if (!client.validateGrantType('client_credentials')) {
            throw new BadRequestException('Client does not support client_credentials grant');
        }

        // Validate client secret
        const passwordObj = Password.fromHash(client.clientSecretHash);
        const isValidSecret = await passwordObj.compare(request.clientSecret);
        if (!isValidSecret) {
            throw new UnauthorizedException('Invalid client credentials');
        }

        // For client_credentials, we don't have an organization member
        // We'll use a special format or create a service account
        // For now, we'll use the client ID as the subject
        const accessTokenPayload = {
            sub: `client:${client.id}`,
            clientId: request.clientId,
            scope: request.scope || client.scopes.join(' '),
            grantType: 'client_credentials',
        };

        const accessToken = this.jwtService.sign(accessTokenPayload, { expiresIn: '1h' });

        // Client credentials typically don't have refresh tokens
        // But we'll create one for consistency
        const refreshToken = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

        const refreshExpiresAt = new Date();
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

        // Note: For client_credentials, we might not want to store tokens
        // or we might use a different storage mechanism
        // For now, we'll skip storing client_credentials tokens

        return new OAuth2TokenResponseDto(
            accessToken,
            'Bearer',
            3600, // 1 hour in seconds
            refreshToken,
            request.scope || client.scopes.join(' '),
        );
    }

    private async handleRefreshToken(request: TokenRequestDto): Promise<OAuth2TokenResponseDto> {
        if (!request.refreshToken || !request.clientId || !request.clientSecret) {
            throw new BadRequestException('Missing required parameters for refresh_token grant');
        }

        // Validate client
        const client = await this.oauthClientRepository.findByClientId(request.clientId);
        if (!client) {
            throw new NotFoundException('Invalid client ID');
        }

        if (!client.isActive) {
            throw new UnauthorizedException('Client is inactive');
        }

        // Validate client secret
        const passwordObj = Password.fromHash(client.clientSecretHash);
        const isValidSecret = await passwordObj.compare(request.clientSecret);
        if (!isValidSecret) {
            throw new UnauthorizedException('Invalid client credentials');
        }

        // Find refresh token
        const oauthToken = await this.oauthTokenRepository.findByRefreshToken(request.refreshToken);
        if (!oauthToken) {
            throw new NotFoundException('Invalid refresh token');
        }

        if (!oauthToken.isRefreshTokenValid()) {
            throw new BadRequestException('Refresh token has expired or been revoked');
        }

        // Revoke old token
        oauthToken.revoke();
        await this.oauthTokenRepository.update(oauthToken);

        // Generate new access token
        const accessTokenPayload = {
            sub: oauthToken.organizationMemberId,
            clientId: request.clientId,
            scope: oauthToken.scope || '',
        };
        const newAccessToken = this.jwtService.sign(accessTokenPayload, { expiresIn: '15m' });

        // Generate new refresh token
        const newRefreshToken = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

        const refreshExpiresAt = new Date();
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

        // Store new token
        const newOAuthToken = OAuthToken.create({
            organizationMemberId: oauthToken.organizationMemberId,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            tokenType: 'Bearer',
            expiresAt,
            refreshExpiresAt,
            scope: oauthToken.scope,
        });
        await this.oauthTokenRepository.create(newOAuthToken);

        return new OAuth2TokenResponseDto(
            newAccessToken,
            'Bearer',
            900, // 15 minutes in seconds
            newRefreshToken,
            oauthToken.scope || '',
        );
    }
}

