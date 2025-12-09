import { Injectable, Inject } from '@nestjs/common';
import { IOAuthTokenRepository } from '../../../domain/repositories/oauth-token.repository.interface';

/**
 * Logout Use Case
 * Revokes user tokens
 */
@Injectable()
export class LogoutUseCase {
    constructor(
        @Inject('IOAuthTokenRepository')
        private readonly tokenRepository: IOAuthTokenRepository,
    ) { }

    async execute(accessToken: string): Promise<void> {
        // 1. Find token
        const token = await this.tokenRepository.findByAccessToken(accessToken);
        if (!token) {
            // Token not found, maybe already deleted or never existed. 
            // Idempotent operation, so we can just return.
            return;
        }

        // 2. Revoke token
        try {
            token.revoke();
            await this.tokenRepository.update(token);
        } catch (error) {
            // Token might be already revoked
            if (error.message === 'Token is already revoked') {
                return;
            }
            throw error;
        }
    }
}
