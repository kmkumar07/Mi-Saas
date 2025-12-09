export interface OAuthTokenProps {
    id: string;
    userId: string;
    accessToken: string;
    refreshToken?: string | null;
    tokenType: string;
    expiresAt: Date;
    refreshExpiresAt?: Date | null;
    scope?: string | null;
    createdAt: Date;
    revokedAt?: Date | null;
}

/**
 * OAuthToken Entity
 * Manages OAuth2 access and refresh tokens
 * Handles token lifecycle including expiration and revocation
 */
export class OAuthToken {
    private constructor(private readonly props: OAuthTokenProps) { }

    static create(props: Omit<OAuthTokenProps, 'id' | 'createdAt' | 'revokedAt'>): OAuthToken {
        return new OAuthToken({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            revokedAt: null,
        });
    }

    static fromPersistence(props: OAuthTokenProps): OAuthToken {
        return new OAuthToken(props);
    }

    get id(): string {
        return this.props.id;
    }

    get userId(): string {
        return this.props.userId;
    }

    get accessToken(): string {
        return this.props.accessToken;
    }

    get refreshToken(): string | null | undefined {
        return this.props.refreshToken;
    }

    get tokenType(): string {
        return this.props.tokenType;
    }

    get expiresAt(): Date {
        return this.props.expiresAt;
    }

    get refreshExpiresAt(): Date | null | undefined {
        return this.props.refreshExpiresAt;
    }

    get scope(): string | null | undefined {
        return this.props.scope;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get revokedAt(): Date | null | undefined {
        return this.props.revokedAt;
    }

    /**
     * Check if access token is expired
     */
    isAccessTokenExpired(): boolean {
        return new Date() > this.props.expiresAt;
    }

    /**
     * Check if refresh token is expired
     */
    isRefreshTokenExpired(): boolean {
        if (!this.props.refreshExpiresAt) {
            return true;
        }
        return new Date() > this.props.refreshExpiresAt;
    }

    /**
     * Check if token is revoked
     */
    isRevoked(): boolean {
        return this.props.revokedAt !== null && this.props.revokedAt !== undefined;
    }

    /**
     * Check if token is valid (not expired and not revoked)
     */
    isValid(): boolean {
        return !this.isAccessTokenExpired() && !this.isRevoked();
    }

    /**
     * Check if refresh token is valid
     */
    isRefreshTokenValid(): boolean {
        return !this.isRefreshTokenExpired() && !this.isRevoked();
    }

    /**
     * Revoke the token
     * Business rule: Token can only be revoked once
     */
    revoke(): void {
        if (this.isRevoked()) {
            throw new Error('Token is already revoked');
        }
        this.props.revokedAt = new Date();
    }

    /**
     * Get time until access token expires (in seconds)
     */
    getTimeUntilExpiry(): number {
        const now = new Date();
        const expiryTime = this.props.expiresAt.getTime();
        const currentTime = now.getTime();
        const diffInMs = expiryTime - currentTime;
        return Math.max(0, Math.floor(diffInMs / 1000));
    }

    /**
     * Check if token has a specific scope
     */
    hasScope(scope: string): boolean {
        if (!this.props.scope) {
            return false;
        }
        const scopes = this.props.scope.split(' ');
        return scopes.includes(scope);
    }

    toPersistence(): OAuthTokenProps {
        return { ...this.props };
    }
}
