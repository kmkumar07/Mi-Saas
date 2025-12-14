import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OAuth2 UserInfo Response DTO (OpenID Connect)
 */
export class UserInfoResponseDto {
    @ApiProperty({
        description: 'Subject identifier (organization_member.id)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    sub: string;

    @ApiPropertyOptional({
        description: 'Email address',
        example: 'user@example.com',
    })
    email?: string;

    @ApiPropertyOptional({
        description: 'Full name',
        example: 'John Doe',
    })
    name?: string;

    @ApiPropertyOptional({
        description: 'Given name (first name)',
        example: 'John',
    })
    given_name?: string;

    @ApiPropertyOptional({
        description: 'Family name (last name)',
        example: 'Doe',
    })
    family_name?: string;

    @ApiPropertyOptional({
        description: 'Email verified',
        example: true,
    })
    email_verified?: boolean;

    @ApiPropertyOptional({
        description: 'Tenant ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    tenant_id?: string;
}

