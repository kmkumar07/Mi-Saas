import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login DTO
 * Validates user login credentials
 */
export class LoginDto {
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
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}
