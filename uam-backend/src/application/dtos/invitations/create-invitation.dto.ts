import { IsEmail, IsNotEmpty, IsArray, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Invitation DTO
 * Validates employee invitation data
 */
export class CreateInvitationDto {
    @ApiProperty({
        description: 'Invitee email address',
        example: 'newemployee@example.com',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        description: 'Array of role IDs to assign (optional, can be empty). Roles can be assigned after user registration.',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray({ message: 'Role IDs must be an array' })
    @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
    roleIds?: string[];
}
