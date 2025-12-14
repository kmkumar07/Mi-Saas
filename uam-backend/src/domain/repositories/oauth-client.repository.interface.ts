import { OAuthClient } from '../entities/oauth-client.entity';

/**
 * OAuth2 Client Repository Interface
 * Defines contract for OAuth2 client persistence operations
 */
export interface IOAuthClientRepository {
    findById(id: string): Promise<OAuthClient | null>;
    findByClientId(clientId: string): Promise<OAuthClient | null>;
    findByTenantId(tenantId: string): Promise<OAuthClient[]>;
    create(client: OAuthClient): Promise<OAuthClient>;
    update(client: OAuthClient): Promise<OAuthClient>;
    delete(id: string): Promise<void>;
    existsByClientId(clientId: string): Promise<boolean>;
}

