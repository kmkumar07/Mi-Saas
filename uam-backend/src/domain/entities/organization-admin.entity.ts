export interface OrganizationAdminProps {
    id: string;
    organizationMemberId: string;
    tenantId: string;
    grantedBy?: string | null;
    grantedAt: Date;
    createdAt: Date;
}

/**
 * Organization Admin Entity
 * Represents tenant-level administrative authority
 * 
 * CRITICAL RULES:
 * - Organization Admins MUST also be organization_members (enforced by FK)
 * - Admin status is an ADDITIVE layer, not a replacement for membership
 * - Admin status grants tenant governance (billing, member management, IdP config)
 * - Admin status does NOT bypass RBAC - admins still need RBAC permissions for features
 * - This layer must NOT bypass RBAC with ad-hoc if/else logic
 * 
 * Use cases for admin authority:
 * - Tenant configuration
 * - Billing management
 * - Identity provider configuration
 * - Member management
 */
export class OrganizationAdmin {
    private constructor(private readonly props: OrganizationAdminProps) { }

    /**
     * Factory method for creating new organization admins
     */
    static create(props: Omit<OrganizationAdminProps, 'id' | 'grantedAt' | 'createdAt'>): OrganizationAdmin {
        const now = new Date();
        return new OrganizationAdmin({
            ...props,
            id: crypto.randomUUID(),
            grantedAt: now,
            createdAt: now,
        });
    }

    /**
     * Factory method for reconstituting from database
     */
    static fromPersistence(props: OrganizationAdminProps): OrganizationAdmin {
        return new OrganizationAdmin(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get organizationMemberId(): string {
        return this.props.organizationMemberId;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get grantedBy(): string | null | undefined {
        return this.props.grantedBy;
    }

    get grantedAt(): Date {
        return this.props.grantedAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    /**
     * Check if admin can manage tenant governance
     * This grants authority for tenant-level operations, but does NOT bypass RBAC
     */
    canManageTenant(tenantId: string): boolean {
        return this.props.tenantId === tenantId;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): OrganizationAdminProps {
        return { ...this.props };
    }
}

