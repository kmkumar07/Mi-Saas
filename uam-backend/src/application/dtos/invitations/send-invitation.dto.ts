import { IsNotEmpty, IsEmail, IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Send Invitation DTO
 * Validates invitation sending data
 */
export class SendInvitationDto {
    @ApiProperty({
        description: 'Email address to invite',
        example: 'newuser@example.com',
    })
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        description: 'Array of role IDs to assign',
        example: ['123e4567-e89b-12d3-a456-426614174000'],
        type: [String],
    })
    @IsArray({ message: 'Role IDs must be an array' })
    @ArrayMinSize(1, { message: 'At least one role ID is required' })
    @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Role IDs are required' })
    roleIds: string[];
}
