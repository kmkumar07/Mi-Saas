import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 Client Registration Response DTO
 */
export class RegisterClientResponseDto {
    @ApiProperty({
        description: 'OAuth2 client ID',
        example: 'client_123456789',
    })
    clientId: string;

    @ApiProperty({
        description: 'OAuth2 client secret (shown only once)',
        example: 'client_secret_xyz',
    })
    clientSecret: string;

    @ApiProperty({
        description: 'Client ID issued at (timestamp)',
        example: 1234567890,
    })
    clientIdIssuedAt: number;

    @ApiProperty({
        description: 'Client secret expiration (null if no expiration)',
        example: null,
    })
    clientSecretExpiresAt: number | null;

    constructor(
        clientId: string,
        clientSecret: string,
        clientIdIssuedAt: number,
        clientSecretExpiresAt: number | null = null,
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.clientIdIssuedAt = clientIdIssuedAt;
        this.clientSecretExpiresAt = clientSecretExpiresAt;
    }
}

