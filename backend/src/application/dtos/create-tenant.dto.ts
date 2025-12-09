import { IsIn, IsNotEmpty, IsOptional, IsObject, IsString } from 'class-validator';
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
        description: 'Tenant account type',
        example: 'company',
        enum: ['individual', 'company'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['individual', 'company'])
    accountType?: string;

    @ApiPropertyOptional({
        description: 'Workspace name (for individual tenants)',
        example: 'John Personal Workspace',
    })
    @IsOptional()
    @IsString()
    workspaceName?: string;

    @ApiPropertyOptional({
        description: 'Additional metadata',
        example: { industry: 'Technology', size: 'Enterprise' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
