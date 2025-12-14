import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { IOAuthClientRepository } from '../../../domain/repositories/oauth-client.repository.interface';
import { OAuthClient } from '../../../domain/entities/oauth-client.entity';
import { RegisterClientRequestDto } from '../../dtos/oauth2/register-client-request.dto';
import { RegisterClientResponseDto } from '../../dtos/oauth2/register-client-response.dto';
import { Password } from '../../../domain/value-objects/password.value-object';
import * as crypto from 'crypto';

/**
 * Register OAuth2 Client Use Case
 * Creates a new OAuth2 client application
 */
@Injectable()
export class RegisterClientUseCase {
    constructor(
        @Inject('IOAuthClientRepository')
        private readonly oauthClientRepository: IOAuthClientRepository,
    ) {}

    async execute(
        request: RegisterClientRequestDto,
        tenantId: string,
    ): Promise<RegisterClientResponseDto> {
        // Generate client ID (random string)
        const clientId = this.generateClientId();

        // Check if client ID already exists (unlikely but possible)
        let exists = await this.oauthClientRepository.existsByClientId(clientId);
        let attempts = 0;
        while (exists && attempts < 10) {
            const newClientId = this.generateClientId();
            exists = await this.oauthClientRepository.existsByClientId(newClientId);
            attempts++;
        }
        if (exists) {
            throw new ConflictException('Failed to generate unique client ID');
        }

        // Generate client secret (random string)
        const clientSecret = this.generateClientSecret();

        // Hash client secret
        const passwordObj = await Password.createFromPlainText(clientSecret);
        const clientSecretHash = passwordObj.getHashedValue();

        // Create OAuth2 client
        const oauthClient = OAuthClient.create({
            clientId,
            clientSecretHash,
            name: request.name,
            redirectUris: request.redirectUris,
            scopes: request.scopes,
            grantTypes: request.grantTypes,
            tenantId,
            isActive: true,
        });

        await this.oauthClientRepository.create(oauthClient);

        return new RegisterClientResponseDto(
            clientId,
            clientSecret, // Return plain secret (shown only once)
            Math.floor(Date.now() / 1000), // clientIdIssuedAt
            null, // clientSecretExpiresAt (no expiration)
        );
    }

    private generateClientId(): string {
        return `client_${crypto.randomBytes(16).toString('hex')}`;
    }

    private generateClientSecret(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

