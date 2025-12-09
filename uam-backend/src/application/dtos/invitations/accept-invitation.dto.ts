import { IsNotEmpty, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Accept Invitation DTO
 * Validates invitation acceptance data
 */
export class AcceptInvitationDto {
    @ApiProperty({
        description: 'Invitation token',
        example: 'abc123def456...',
    })
    @IsString()
    @IsNotEmpty({ message: 'Invitation token is required' })
    token: string;

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
}
