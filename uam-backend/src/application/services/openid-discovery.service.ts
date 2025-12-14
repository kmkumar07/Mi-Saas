import { Injectable } from '@nestjs/common';

/**
 * OpenID Connect Discovery Service
 * Provides OpenID Connect discovery document
 */
@Injectable()
export class OpenIdDiscoveryService {
    getDiscoveryDocument(baseUrl: string): any {
        return {
            issuer: `${baseUrl}/oauth2`,
            authorization_endpoint: `${baseUrl}/oauth2/authorize`,
            token_endpoint: `${baseUrl}/oauth2/token`,
            userinfo_endpoint: `${baseUrl}/oauth2/userinfo`,
            jwks_uri: `${baseUrl}/oauth2/.well-known/jwks.json`, // TODO: Implement JWKS endpoint
            scopes_supported: ['openid', 'profile', 'email'],
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
            token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'], // TODO: Implement ID token
            claims_supported: ['sub', 'email', 'name', 'given_name', 'family_name', 'email_verified', 'tenant_id'],
        };
    }
}

