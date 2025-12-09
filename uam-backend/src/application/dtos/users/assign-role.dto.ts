import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Assign Role DTO
 * Validates role assignment data
 */
export class AssignRoleDto {
    @ApiProperty({
        description: 'Role ID to assign',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'Invalid role ID format' })
    @IsNotEmpty({ message: 'Role ID is required' })
    roleId: string;

    @ApiProperty({
        description: 'Product ID for which the role is being assigned (optional)',
        example: '223e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsUUID('4', { message: 'Invalid product ID format' })
    @IsOptional()
    productId?: string;
}
