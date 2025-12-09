import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register Tenant DTO
 * Used when a tenant is registered via the UAM backend.
 */
export class RegisterTenantDto {
    @ApiProperty({
        description: 'Admin email address',
        example: 'owner@example.com',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        description:
            'Admin password (min 8 chars, must include uppercase, lowercase, number, and special character)',
        example: 'SecureP@ssw0rd',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain uppercase, lowercase, number, and special character',
    })
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

    @ApiPropertyOptional({
        description: 'Admin first name',
        example: 'John',
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Admin last name',
        example: 'Doe',
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({
        description: 'Tenant account type',
        example: 'company',
        enum: ['individual', 'company'],
    })
    @IsString()
    @IsIn(['individual', 'company'])
    accountType: 'individual' | 'company';

    @ApiPropertyOptional({
        description: 'Company name (for company tenants)',
        example: 'Acme Inc.',
    })
    @IsString()
    @IsOptional()
    companyName?: string;

    @ApiPropertyOptional({
        description: 'Workspace name (for individual tenants)',
        example: 'John Personal Workspace',
    })
    @IsString()
    @IsOptional()
    workspaceName?: string;
}


