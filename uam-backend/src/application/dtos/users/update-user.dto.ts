import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update User DTO
 * Validates user update data (all fields optional)
 */
export class UpdateUserDto {
    @ApiProperty({
        description: 'User first name',
        example: 'John',
        required: false,
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        required: false,
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({
        description: 'User active status',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
