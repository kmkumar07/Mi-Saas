import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh Token DTO
 * Validates refresh token request
 */
export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken: string;
}
