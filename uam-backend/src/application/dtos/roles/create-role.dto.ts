import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Role DTO
 * Validates custom role creation data
 */
export class CreateRoleDto {
    @ApiProperty({
        description: 'Tenant ID for tenant-specific role',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'Invalid tenant ID format' })
    @IsNotEmpty({ message: 'Tenant ID is required' })
    tenantId: string;

    @ApiProperty({
        description: 'Role code (unique identifier)',
        example: 'custom_manager',
    })
    @IsString()
    @IsNotEmpty({ message: 'Role code is required' })
    roleCode: string;

    @ApiProperty({
        description: 'Role display name',
        example: 'Custom Manager',
    })
    @IsString()
    @IsNotEmpty({ message: 'Role name is required' })
    roleName: string;

    @ApiProperty({
        description: 'Role description',
        example: 'Custom role for managing specific features',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Hierarchy level (1=highest, 4=lowest)',
        example: 3,
        minimum: 1,
        maximum: 4,
    })
    @IsInt()
    @Min(1, { message: 'Hierarchy level must be at least 1' })
    @Max(4, { message: 'Hierarchy level must not exceed 4' })
    @IsNotEmpty({ message: 'Hierarchy level is required' })
    hierarchyLevel: number;
}
