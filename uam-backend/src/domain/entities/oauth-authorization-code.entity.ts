export interface OAuthAuthorizationCodeProps {
    id: string;
    code: string;
    clientId: string;
    organizationMemberId: string;
    redirectUri: string;
    scopes: string[];
    expiresAt: Date;
    createdAt: Date;
}

/**
 * OAuth2 Authorization Code Entity
 * Represents a temporary authorization code used in the authorization code flow
 * Single-use, short-lived (10 minutes)
 */
export class OAuthAuthorizationCode {
    private constructor(private readonly props: OAuthAuthorizationCodeProps) { }

    /**
     * Factory method for creating new authorization codes
     */
    static create(props: Omit<OAuthAuthorizationCodeProps, 'id' | 'createdAt'>): OAuthAuthorizationCode {
        const now = new Date();
        return new OAuthAuthorizationCode({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: OAuthAuthorizationCodeProps): OAuthAuthorizationCode {
        return new OAuthAuthorizationCode(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get code(): string {
        return this.props.code;
    }

    get clientId(): string {
        return this.props.clientId;
    }

    get organizationMemberId(): string {
        return this.props.organizationMemberId;
    }

    get redirectUri(): string {
        return this.props.redirectUri;
    }

    get scopes(): string[] {
        return [...this.props.scopes];
    }

    get expiresAt(): Date {
        return this.props.expiresAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    /**
     * Check if code is expired
     */
    isExpired(): boolean {
        return new Date() >= this.props.expiresAt;
    }

    /**
     * Check if code is valid (not expired)
     */
    isValid(): boolean {
        return !this.isExpired();
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): OAuthAuthorizationCodeProps {
        return { ...this.props };
    }
}

