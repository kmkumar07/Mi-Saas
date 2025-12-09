import { ApiProperty } from '@nestjs/swagger';

/**
 * Token Response DTO
 * Contains access and refresh tokens
 */
export class TokenResponseDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    @ApiProperty({
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer',
    })
    tokenType: string;

    @ApiProperty({
        description: 'Access token expiration time in seconds',
        example: 900,
    })
    expiresIn: number;

    constructor(accessToken: string, refreshToken: string, expiresIn: number) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = 'Bearer';
        this.expiresIn = expiresIn;
    }
}
