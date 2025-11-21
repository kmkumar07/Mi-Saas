import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a tenant
 */
export class CreateTenantDto {
    @ApiProperty({
        description: 'Tenant name',
        example: 'Acme Corporation',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Email domain for the tenant',
        example: 'acme.com',
    })
    @IsOptional()
    @IsString()
    emailDomain?: string;

    @ApiPropertyOptional({
        description: 'Additional metadata',
        example: { industry: 'Technology', size: 'Enterprise' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
