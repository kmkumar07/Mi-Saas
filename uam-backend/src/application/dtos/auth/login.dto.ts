import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login DTO
 * Validates user login credentials
 * 
 * UPDATED: Added tenantId - required for new authentication resolution flow
 * Authentication resolution: auth_account → identity → organization_members (tenant-scoped)
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

    @ApiProperty({
        description: 'Tenant ID - required for organization membership resolution',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID(4, { message: 'Tenant ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Tenant ID is required' })
    tenantId: string;
}
