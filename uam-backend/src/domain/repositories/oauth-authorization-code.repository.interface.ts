import { OAuthAuthorizationCode } from '../entities/oauth-authorization-code.entity';

/**
 * OAuth2 Authorization Code Repository Interface
 * Defines contract for OAuth2 authorization code persistence operations
 */
export interface IOAuthAuthorizationCodeRepository {
    findById(id: string): Promise<OAuthAuthorizationCode | null>;
    findByCode(code: string): Promise<OAuthAuthorizationCode | null>;
    findByClientId(clientId: string): Promise<OAuthAuthorizationCode[]>;
    findByOrganizationMemberId(organizationMemberId: string): Promise<OAuthAuthorizationCode[]>;
    create(code: OAuthAuthorizationCode): Promise<OAuthAuthorizationCode>;
    delete(id: string): Promise<void>;
    deleteByCode(code: string): Promise<void>;
    deleteExpiredCodes(): Promise<void>;
}

