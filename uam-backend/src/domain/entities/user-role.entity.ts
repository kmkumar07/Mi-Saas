export interface UserRoleProps {
    id: string;
    userId: string;
    roleId: string;
    productId?: string | null;
    assignedBy?: string | null;
    assignedAt: Date;
}

/**
 * UserRole Entity
 * Represents the assignment of a role to a user
 * Follows Single Responsibility Principle - handles user-role relationship logic
 */
export class UserRole {
    private constructor(private readonly props: UserRoleProps) { }

    // Factory method for creating new user-role assignments
    static create(props: Omit<UserRoleProps, 'id' | 'assignedAt'>): UserRole {
        return new UserRole({
            ...props,
            id: crypto.randomUUID(),
            assignedAt: new Date(),
        });
    }

    // Factory method for reconstituting from database
    static fromPersistence(props: UserRoleProps): UserRole {
        return new UserRole(props);
    }

    // Getters
    get id(): string {
        return this.props.id;
    }

    get userId(): string {
        return this.props.userId;
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
     * Check if this assignment was made by a specific user
     */
    wasAssignedBy(userId: string): boolean {
        return this.props.assignedBy === userId;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): UserRoleProps {
        return { ...this.props };
    }
}
