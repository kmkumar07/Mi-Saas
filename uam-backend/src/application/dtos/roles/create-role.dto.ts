import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Role DTO
 * Validates custom role creation data
 */
export class CreateRoleDto {
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
