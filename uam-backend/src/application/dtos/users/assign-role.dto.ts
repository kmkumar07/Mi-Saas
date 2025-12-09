import { IsNotEmpty, IsUUID } from 'class-validator';
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
}
