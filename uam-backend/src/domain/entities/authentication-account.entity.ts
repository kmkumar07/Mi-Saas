export type AuthenticationProvider = 'local' | 'azure_ad' | 'google' | 'cognito';

export interface AuthenticationAccountProps {
    id: string;
    identityId: string;
    provider: AuthenticationProvider;
    providerAccountId?: string | null;
    email: string;
    passwordHash?: string | null;
    externalId?: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Authentication Account Entity
 * Represents a login method for an identity
 * Separates authentication from identity, allowing one person to have multiple login methods
 * (e.g., local password, Azure AD, Google, Cognito)
 * 
 * CRITICAL: Authentication accounts are for login only. They do NOT grant access.
 * Access requires: auth_account → identity → organization_members → authorization layers
 */
export class AuthenticationAccount {
    private constructor(private readonly props: AuthenticationAccountProps) { }

    /**
     * Factory method for creating new authentication accounts
     */
    static create(props: Omit<AuthenticationAccountProps, 'id' | 'createdAt' | 'updatedAt'>): AuthenticationAccount {
        const now = new Date();
        return new AuthenticationAccount({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: AuthenticationAccountProps): AuthenticationAccount {
        return new AuthenticationAccount(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get identityId(): string {
        return this.props.identityId;
    }

    get provider(): AuthenticationProvider {
        return this.props.provider;
    }

    get providerAccountId(): string | null | undefined {
        return this.props.providerAccountId;
    }

    get email(): string {
        return this.props.email;
    }

    get passwordHash(): string | null | undefined {
        return this.props.passwordHash;
    }

    get externalId(): string | null | undefined {
        return this.props.externalId;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get isEmailVerified(): boolean {
        return this.props.isEmailVerified;
    }

    get lastLoginAt(): Date | null | undefined {
        return this.props.lastLoginAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Activate authentication account
     */
    activate(): void {
        if (this.props.isActive) {
            throw new Error('Authentication account is already active');
        }
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Deactivate authentication account
     */
    deactivate(): void {
        if (!this.props.isActive) {
            throw new Error('Authentication account is already inactive');
        }
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Verify email
     */
    verifyEmail(): void {
        this.props.isEmailVerified = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Record login
     */
    recordLogin(): void {
        this.props.lastLoginAt = new Date();
        this.props.updatedAt = new Date();
    }

    /**
     * Check if this is a local provider (has password)
     */
    isLocalProvider(): boolean {
        return this.props.provider === 'local';
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): AuthenticationAccountProps {
        return { ...this.props };
    }
}

