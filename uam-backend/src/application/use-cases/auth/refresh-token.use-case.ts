import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IOAuthTokenRepository } from '../../../domain/repositories/oauth-token.repository.interface';
import { TokenResponseDto } from '../../dtos/auth/token-response.dto';

/**
 * Refresh Token Use Case
 * Validates refresh token and issues new access token
 */
@Injectable()
export class RefreshTokenUseCase {
    constructor(
        @Inject('IOAuthTokenRepository')
        private readonly tokenRepository: IOAuthTokenRepository,
    ) { }

    async execute(refreshToken: string): Promise<TokenResponseDto> {
        // 1. Find token in database
        const token = await this.tokenRepository.findByRefreshToken(refreshToken);

        if (!token) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 2. Check if token is expired or revoked
        if (token.isRefreshTokenExpired() || token.isRevoked()) {
            throw new UnauthorizedException('Refresh token expired or revoked');
        }

        // 3. In a real implementation, we would:
        // - Verify the JWT signature
        // - Generate a new access token
        // - Optionally rotate the refresh token

        // For this MVP, we'll just mock a new access token
        // In production, use a proper JWT service
        const newAccessToken = `mock_access_token_${Date.now()}`;
        const expiresIn = 3600; // 1 hour

        return {
            accessToken: newAccessToken,
            refreshToken: refreshToken, // Return same refresh token for now
            expiresIn,
            tokenType: 'Bearer',
        };
    }
}
