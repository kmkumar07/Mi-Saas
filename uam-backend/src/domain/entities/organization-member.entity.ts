export interface OrganizationMemberProps {
    id: string; // This becomes the JWT sub claim (tenant-scoped)
    identityId: string;
    tenantId: string;
    isActive: boolean;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Organization Member Entity
 * Represents the baseline membership requirement for all access
 * This is the REQUIRED layer - no actor can access tenant or product resources without being a member.
 * 
 * CRITICAL RULES:
 * - Every actor accessing tenant or product resources MUST be an organization member
 * - Organization Admin and Product Access are ADDITIVE layers, not replacements
 * - RBAC subject is always organization_members.id, never identity.id
 * - The JWT sub claim is organization_members.id (tenant-scoped)
 * 
 * This entity enforces the core principle: Identity → Organization Member (baseline, required)
 */
export class OrganizationMember {
    private constructor(private readonly props: OrganizationMemberProps) { }

    /**
     * Factory method for creating new organization members
     */
    static create(props: Omit<OrganizationMemberProps, 'id' | 'joinedAt' | 'createdAt' | 'updatedAt'>): OrganizationMember {
        const now = new Date();
        return new OrganizationMember({
            ...props,
            id: crypto.randomUUID(),
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: OrganizationMemberProps): OrganizationMember {
        return new OrganizationMember(props);
    }

    // Getters
    get id(): string {
        return this.props.id; // This is the JWT sub claim
    }

    get identityId(): string {
        return this.props.identityId;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get joinedAt(): Date {
        return this.props.joinedAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Activate membership
     * Business rule: Member must not already be active
     */
    activate(): void {
        if (this.props.isActive) {
            throw new Error('Member is already active');
        }
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Deactivate membership
     * Business rule: Member must be active
     * NOTE: Deactivating membership removes all access, but does NOT affect billing (accountType)
     */
    deactivate(): void {
        if (!this.props.isActive) {
            throw new Error('Member is already inactive');
        }
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Check if member can access tenant resources
     * This is the baseline check - all other authorization layers build on this
     */
    canAccessTenant(tenantId: string): boolean {
        return this.props.isActive && this.props.tenantId === tenantId;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): OrganizationMemberProps {
        return { ...this.props };
    }
}

