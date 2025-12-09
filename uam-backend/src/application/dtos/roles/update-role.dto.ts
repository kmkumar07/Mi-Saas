import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update Role DTO
 * Validates role update data
 */
export class UpdateRoleDto {
    @ApiProperty({
        description: 'Role display name',
        example: 'Updated Manager',
        required: false,
    })
    @IsString()
    @IsOptional()
    roleName?: string;

    @ApiProperty({
        description: 'Role description',
        example: 'Updated role description',
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
        required: false,
    })
    @IsInt()
    @Min(1, { message: 'Hierarchy level must be at least 1' })
    @Max(4, { message: 'Hierarchy level must not exceed 4' })
    @IsOptional()
    hierarchyLevel?: number;
}
