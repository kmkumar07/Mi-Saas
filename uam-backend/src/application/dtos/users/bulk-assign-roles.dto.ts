import { IsNotEmpty, IsArray, IsUUID, ArrayMinSize, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Bulk Assign Roles DTO
 * Validates bulk role assignment data
 */
export class BulkAssignRolesDto {
    @ApiProperty({
        description: 'Array of role IDs to assign',
        example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
        type: [String],
    })
    @IsArray({ message: 'Role IDs must be an array' })
    @ArrayMinSize(1, { message: 'At least one role ID is required' })
    @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Role IDs are required' })
    roleIds: string[];

    @ApiProperty({
        description: 'Product ID for which the roles are being assigned (optional, applies to all roleIds)',
        example: '223e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsUUID('4', { message: 'Invalid product ID format' })
    @IsOptional()
    productId?: string;
}
