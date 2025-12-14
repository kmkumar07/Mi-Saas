import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OAuth2 Token Request DTO
 */
export class TokenRequestDto {
    @ApiProperty({
        description: 'Grant type',
        example: 'authorization_code',
        enum: ['authorization_code', 'client_credentials', 'refresh_token'],
    })
    @IsString()
    @IsIn(['authorization_code', 'client_credentials', 'refresh_token'])
    grantType: string;

    @ApiPropertyOptional({
        description: 'Authorization code (required for authorization_code grant)',
        example: 'abc123xyz',
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiPropertyOptional({
        description: 'Redirect URI (required for authorization_code grant)',
        example: 'https://example.com/callback',
    })
    @IsString()
    @IsOptional()
    redirectUri?: string;

    @ApiPropertyOptional({
        description: 'OAuth2 client ID',
        example: 'client_123456789',
    })
    @IsString()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({
        description: 'OAuth2 client secret',
        example: 'client_secret_xyz',
    })
    @IsString()
    @IsOptional()
    clientSecret?: string;

    @ApiPropertyOptional({
        description: 'Refresh token (required for refresh_token grant)',
        example: 'refresh_token_xyz',
    })
    @IsString()
    @IsOptional()
    refreshToken?: string;

    @ApiPropertyOptional({
        description: 'Requested scopes',
        example: 'openid profile email',
    })
    @IsString()
    @IsOptional()
    scope?: string;
}

