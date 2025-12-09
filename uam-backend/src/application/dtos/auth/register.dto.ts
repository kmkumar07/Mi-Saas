import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Register DTO
 * Validates user registration data
 */
export class RegisterDto {
    @ApiProperty({
        description: 'Tenant ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'Invalid tenant ID format' })
    @IsNotEmpty({ message: 'Tenant ID is required' })
    tenantId: string;

    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        description: 'User password (min 8 chars, must include uppercase, lowercase, number, and special character)',
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
}
