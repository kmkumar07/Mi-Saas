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
    findByOrganizationMemberId(organizationMemberId: string): Promise<OAuthToken[]>;
    findActiveByOrganizationMemberId(organizationMemberId: string): Promise<OAuthToken[]>;
    create(token: OAuthToken): Promise<OAuthToken>;
    update(token: OAuthToken): Promise<OAuthToken>;
    delete(id: string): Promise<void>;
    revokeByOrganizationMemberId(organizationMemberId: string): Promise<void>;
    deleteExpiredTokens(): Promise<void>;
    // Backward compatibility methods
    findByUserId(userId: string): Promise<OAuthToken[]>;
    findActiveByUserId(userId: string): Promise<OAuthToken[]>;
    revokeByUserId(userId: string): Promise<void>;
}
