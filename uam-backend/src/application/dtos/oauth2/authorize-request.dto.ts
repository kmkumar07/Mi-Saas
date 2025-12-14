import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OAuth2 Authorization Request DTO
 */
export class AuthorizeRequestDto {
    @ApiProperty({
        description: 'OAuth2 client ID',
        example: 'client_123456789',
    })
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty({
        description: 'Redirect URI (must match registered URI)',
        example: 'https://example.com/callback',
    })
    @IsString()
    @IsNotEmpty()
    redirectUri: string;

    @ApiProperty({
        description: 'Response type (must be "code" for authorization code flow)',
        example: 'code',
        enum: ['code'],
    })
    @IsString()
    @IsIn(['code'])
    responseType: string;

    @ApiPropertyOptional({
        description: 'Space-separated list of scopes',
        example: 'openid profile email',
    })
    @IsString()
    @IsOptional()
    scope?: string;

    @ApiPropertyOptional({
        description: 'State parameter for CSRF protection',
        example: 'random_state_string',
    })
    @IsString()
    @IsOptional()
    state?: string;
}

