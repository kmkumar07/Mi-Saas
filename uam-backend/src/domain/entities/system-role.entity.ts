import { SystemRoleCode } from '../enums';

export interface SystemRoleProps {
    id: string;
    tenantId?: string | null;
    roleCode: string;
    roleName: string;
    description?: string | null;
    isSystemRole: boolean;
    hierarchyLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * SystemRole Entity
 * Represents a role in the RBAC system
 * Can be global (tenantId = null) or tenant-specific
 */
export class SystemRole {
    private constructor(private readonly props: SystemRoleProps) { }

    static create(props: Omit<SystemRoleProps, 'id' | 'createdAt' | 'updatedAt'>): SystemRole {
        const now = new Date();
        return new SystemRole({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }

    static fromPersistence(props: SystemRoleProps): SystemRole {
        return new SystemRole(props);
    }

    get id(): string {
        return this.props.id;
    }

    get tenantId(): string | null | undefined {
        return this.props.tenantId;
    }

    get roleCode(): string {
        return this.props.roleCode;
    }

    get roleName(): string {
        return this.props.roleName;
    }

    get description(): string | null | undefined {
        return this.props.description;
    }

    get isSystemRole(): boolean {
        return this.props.isSystemRole;
    }

    get hierarchyLevel(): number {
        return this.props.hierarchyLevel;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Check if this is a global system role
     */
    isGlobal(): boolean {
        return this.props.tenantId === null || this.props.tenantId === undefined;
    }

    /**
     * Check if this role is tenant-specific
     */
    isTenantSpecific(): boolean {
        return !this.isGlobal();
    }

    /**
     * Check if this role can be deleted
     * Business rule: System roles cannot be deleted
     */
    canBeDeleted(): boolean {
        return !this.props.isSystemRole;
    }

    toPersistence(): SystemRoleProps {
        return { ...this.props };
    }
}
