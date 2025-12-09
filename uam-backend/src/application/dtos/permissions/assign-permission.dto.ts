import { IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Assign Permission DTO
 * Validates permission assignment to role
 */
export class AssignPermissionDto {
    @ApiProperty({
        description: 'Feature ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'Invalid feature ID format' })
    @IsNotEmpty({ message: 'Feature ID is required' })
    featureId: string;

    @ApiProperty({
        description: 'Can read permission',
        example: true,
        default: false,
    })
    @IsBoolean()
    @IsNotEmpty()
    canRead: boolean;

    @ApiProperty({
        description: 'Can write permission',
        example: true,
        default: false,
    })
    @IsBoolean()
    @IsNotEmpty()
    canWrite: boolean;

    @ApiProperty({
        description: 'Can execute permission',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsNotEmpty()
    canExecute: boolean;
}
