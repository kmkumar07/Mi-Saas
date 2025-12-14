export interface OAuthClientProps {
    id: string;
    clientId: string;
    clientSecretHash: string;
    name: string;
    redirectUris: string[];
    scopes: string[];
    grantTypes: string[];
    tenantId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * OAuth2 Client Entity
 * Represents an OAuth2 client application that can request authorization
 */
export class OAuthClient {
    private constructor(private readonly props: OAuthClientProps) { }

    /**
     * Factory method for creating new OAuth2 clients
     */
    static create(props: Omit<OAuthClientProps, 'id' | 'createdAt' | 'updatedAt'>): OAuthClient {
        const now = new Date();
        return new OAuthClient({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: OAuthClientProps): OAuthClient {
        return new OAuthClient(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get clientId(): string {
        return this.props.clientId;
    }

    get clientSecretHash(): string {
        return this.props.clientSecretHash;
    }

    get name(): string {
        return this.props.name;
    }

    get redirectUris(): string[] {
        return [...this.props.redirectUris];
    }

    get scopes(): string[] {
        return [...this.props.scopes];
    }

    get grantTypes(): string[] {
        return [...this.props.grantTypes];
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Validate redirect URI against registered URIs
     */
    validateRedirectUri(uri: string): boolean {
        return this.props.redirectUris.some(registeredUri => {
            // Exact match
            if (registeredUri === uri) {
                return true;
            }
            // Wildcard support (e.g., https://*.example.com/*)
            const pattern = registeredUri
                .replace(/\*/g, '.*')
                .replace(/\?/g, '\\?');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(uri);
        });
    }

    /**
     * Validate scope against registered scopes
     */
    validateScope(scope: string): boolean {
        const requestedScopes = scope.split(' ').filter(s => s.length > 0);
        return requestedScopes.every(s => this.props.scopes.includes(s));
    }

    /**
     * Validate grant type
     */
    validateGrantType(grantType: string): boolean {
        return this.props.grantTypes.includes(grantType);
    }

    /**
     * Activate client
     */
    activate(): void {
        if (this.props.isActive) {
            throw new Error('Client is already active');
        }
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Deactivate client
     */
    deactivate(): void {
        if (!this.props.isActive) {
            throw new Error('Client is already inactive');
        }
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Update redirect URIs
     */
    updateRedirectUris(redirectUris: string[]): void {
        this.props.redirectUris = [...redirectUris];
        this.props.updatedAt = new Date();
    }

    /**
     * Update scopes
     */
    updateScopes(scopes: string[]): void {
        this.props.scopes = [...scopes];
        this.props.updatedAt = new Date();
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): OAuthClientProps {
        return { ...this.props };
    }
}

