import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update Permission DTO
 * Validates permission update data
 */
export class UpdatePermissionDto {
    @ApiProperty({
        description: 'Can read permission',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    canRead?: boolean;

    @ApiProperty({
        description: 'Can write permission',
        example: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    canWrite?: boolean;

    @ApiProperty({
        description: 'Can execute permission',
        example: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    canExecute?: boolean;
}
