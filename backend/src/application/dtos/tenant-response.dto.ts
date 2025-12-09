import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for tenant response
 */
export class TenantResponseDto {
    @ApiProperty({
        description: 'Tenant ID',
        example: 'uuid',
    })
    id: string;

    @ApiProperty({
        description: 'Tenant name',
        example: 'Acme Corporation',
    })
    name: string;

    @ApiPropertyOptional({
        description: 'Email domain',
        example: 'acme.com',
    })
    emailDomain?: string;

    @ApiPropertyOptional({
        description: 'Metadata',
        example: { industry: 'Technology', size: 'Enterprise' },
    })
    metadata?: Record<string, any>;

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2025-01-01T00:00:00Z',
    })
    createdAt: Date;
}
