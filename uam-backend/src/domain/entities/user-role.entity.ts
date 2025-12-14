export interface MemberRoleProps {
    id: string;
    organizationMemberId: string; // Changed from userId - RBAC subject is always organization_members.id
    roleId: string;
    productId?: string | null;
    assignedBy?: string | null;
    assignedAt: Date;
}

/**
 * Member Role Entity
 * Represents the assignment of a role to an organization member
 * RENAMED from UserRole to reflect new permission model
 * 
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 * This ensures RBAC is tenant-scoped and respects the membership requirement.
 * 
 * Follows Single Responsibility Principle - handles member-role relationship logic
 */
export class MemberRole {
    private constructor(private readonly props: MemberRoleProps) { }

    // Factory method for creating new member-role assignments
    static create(props: Omit<MemberRoleProps, 'id' | 'assignedAt'>): MemberRole {
        return new MemberRole({
            ...props,
            id: crypto.randomUUID(),
            assignedAt: new Date(),
        });
    }

    // Factory method for reconstituting from database
    static fromPersistence(props: MemberRoleProps): MemberRole {
        return new MemberRole(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get organizationMemberId(): string {
        return this.props.organizationMemberId; // RBAC subject
    }

    get roleId(): string {
        return this.props.roleId;
    }

    get productId(): string | null | undefined {
        return this.props.productId;
    }

    get assignedBy(): string | null | undefined {
        return this.props.assignedBy;
    }

    get assignedAt(): Date {
        return this.props.assignedAt;
    }

    /**
     * Check if this assignment was made by a specific member
     */
    wasAssignedBy(organizationMemberId: string): boolean {
        return this.props.assignedBy === organizationMemberId;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): MemberRoleProps {
        return { ...this.props };
    }
}
