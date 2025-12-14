export interface IdentityProps {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Identity Entity
 * Represents a global human identity across all tenants
 * This is the foundation of the identity layer in the permission model.
 * One identity can have multiple authentication accounts and be a member of multiple tenants.
 * 
 * CRITICAL: Identity alone does NOT grant access. All access requires organization_membership.
 */
export class Identity {
    private constructor(private readonly props: IdentityProps) { }

    /**
     * Factory method for creating new identities
     */
    static create(props: Omit<IdentityProps, 'id' | 'createdAt' | 'updatedAt'>): Identity {
        const now = new Date();
        return new Identity({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: IdentityProps): Identity {
        return new Identity(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get email(): string {
        return this.props.email;
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

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
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
     * Convert to plain object for persistence
     */
    toPersistence(): IdentityProps {
        return { ...this.props };
    }
}

