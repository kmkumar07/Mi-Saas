import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create User DTO
 * Validates user creation data
 */
export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

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
        description: 'Authentication provider',
        example: 'local',
        enum: ['local', 'azure_ad'],
        default: 'local',
        required: false,
    })
    @IsEnum(['local', 'azure_ad'], { message: 'Invalid auth provider' })
    @IsOptional()
    authProvider?: string;

    @ApiProperty({
        description: 'Account type',
        example: 'individual',
        enum: ['individual', 'company'],
        default: 'individual',
        required: false,
    })
    @IsEnum(['individual', 'company'], { message: 'Invalid account type' })
    @IsOptional()
    accountType?: string;
}
