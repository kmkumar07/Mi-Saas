import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OAuth2 Token Response DTO
 */
export class OAuth2TokenResponseDto {
    @ApiProperty({
        description: 'Access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    access_token: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer',
    })
    token_type: string;

    @ApiProperty({
        description: 'Access token expiration time in seconds',
        example: 900,
    })
    expires_in: number;

    @ApiPropertyOptional({
        description: 'Refresh token',
        example: 'refresh_token_xyz',
    })
    refresh_token?: string;

    @ApiPropertyOptional({
        description: 'Granted scopes',
        example: 'openid profile email',
    })
    scope?: string;

    constructor(
        accessToken: string,
        tokenType: string,
        expiresIn: number,
        refreshToken?: string,
        scope?: string,
    ) {
        this.access_token = accessToken;
        this.token_type = tokenType;
        this.expires_in = expiresIn;
        if (refreshToken) {
            this.refresh_token = refreshToken;
        }
        if (scope) {
            this.scope = scope;
        }
    }
}

