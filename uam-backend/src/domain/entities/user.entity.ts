import { AccountType, AuthProvider } from '../enums';

export interface UserProps {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    authProvider: AuthProvider;
    externalId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    accountType: AccountType;
    organizationId?: string | null;
    isCompanyOwner: boolean;
    isSyncedFromAd: boolean;
    lastSyncedAt?: Date | null;
    emailDomain?: string | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User Entity
 * Represents a user in the system with authentication and authorization
 * Follows Single Responsibility Principle - handles user business logic only
 */
export class User {
    private constructor(private readonly props: UserProps) { }

    // Factory method for creating new users
    static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
        const now = new Date();
        return new User({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }

    // Factory method for reconstituting from database
    static fromPersistence(props: UserProps): User {
        return new User(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get email(): string {
        return this.props.email;
    }

    get passwordHash(): string {
        return this.props.passwordHash;
    }

    get authProvider(): AuthProvider {
        return this.props.authProvider;
    }

    get firstName(): string | null | undefined {
        return this.props.firstName;
    }

    get lastName(): string | null | undefined {
        return this.props.lastName;
    }

    get fullName(): string {
        return [this.props.firstName, this.props.lastName].filter(Boolean).join(' ') || this.props.email;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get isEmailVerified(): boolean {
        return this.props.isEmailVerified;
    }

    get accountType(): AccountType {
        return this.props.accountType;
    }

    get isCompanyOwner(): boolean {
        return this.props.isCompanyOwner;
    }

    get emailDomain(): string | null | undefined {
        return this.props.emailDomain;
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

    // Business logic methods

    /**
     * Activate user account
     * Business rule: User must not already be active
     */
    activate(): void {
        if (this.props.isActive) {
            throw new Error('User is already active');
        }
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Deactivate user account
     * Business rule: User must be active
     */
    deactivate(): void {
        if (!this.props.isActive) {
            throw new Error('User is already inactive');
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
     * Update profile information
     */
    updateProfile(firstName?: string, lastName?: string): void {
        if (firstName !== undefined) {
            this.props.firstName = firstName;
        }
        if (lastName !== undefined) {
            this.props.lastName = lastName;
        }
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
     * Check if user can be managed by company
     * Business rule: Only company account type can be managed by organization
     */
    canBeManagedByCompany(): boolean {
        return this.props.accountType === AccountType.COMPANY;
    }

    /**
     * Check if user is independent
     */
    isIndependent(): boolean {
        return this.props.accountType === AccountType.INDIVIDUAL;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): UserProps {
        return { ...this.props };
    }
}
