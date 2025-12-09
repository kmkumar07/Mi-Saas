import { OAuthToken } from '../entities/oauth-token.entity';

/**
 * OAuthToken Repository Interface
 * Defines contract for OAuth token persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 */
export interface IOAuthTokenRepository {
    findById(id: string): Promise<OAuthToken | null>;
    findByAccessToken(accessToken: string): Promise<OAuthToken | null>;
    findByRefreshToken(refreshToken: string): Promise<OAuthToken | null>;
    findByUserId(userId: string): Promise<OAuthToken[]>;
    findActiveByUserId(userId: string): Promise<OAuthToken[]>;
    create(token: OAuthToken): Promise<OAuthToken>;
    update(token: OAuthToken): Promise<OAuthToken>;
    delete(id: string): Promise<void>;
    revokeByUserId(userId: string): Promise<void>;
    deleteExpiredTokens(): Promise<void>;
}
