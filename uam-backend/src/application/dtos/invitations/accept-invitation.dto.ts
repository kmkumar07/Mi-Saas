import { IsNotEmpty, IsString, MinLength, Matches, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Accept Invitation DTO
 * Validates invitation acceptance data
 */
export class AcceptInvitationDto {
    @ApiProperty({
        description: 'User password',
        example: 'SecureP@ssw0rd',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain uppercase, lowercase, number, and special character',
    })
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

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
        description: 'Product ID to scope assigned roles to (optional)',
        example: '223e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsUUID('4', { message: 'Invalid product ID format' })
    @IsOptional()
    productId?: string;

    @ApiProperty({
        description: 'Role IDs to assign to the user (admin activation only)',
        example: ['0f8fad5b-d9cb-469f-a165-70867728950e'],
        required: false,
        isArray: true,
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    roleIds?: string[];
}
