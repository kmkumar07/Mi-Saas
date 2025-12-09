import { PermissionAction } from '../enums';

export interface RolePermissionProps {
    id: string;
    tenantId?: string | null;
    roleId: string;
    featureId: string;
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * RolePermission Entity
 * Defines granular permissions (read/write/execute) for role-feature combinations
 * Follows Single Responsibility Principle - manages permission logic only
 */
export class RolePermission {
    private constructor(private readonly props: RolePermissionProps) { }

    static create(props: Omit<RolePermissionProps, 'id' | 'createdAt' | 'updatedAt'>): RolePermission {
        const now = new Date();
        return new RolePermission({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }

    static fromPersistence(props: RolePermissionProps): RolePermission {
        return new RolePermission(props);
    }

    get id(): string {
        return this.props.id;
    }

    get tenantId(): string | null | undefined {
        return this.props.tenantId;
    }

    get roleId(): string {
        return this.props.roleId;
    }

    get featureId(): string {
        return this.props.featureId;
    }

    get canRead(): boolean {
        return this.props.canRead;
    }

    get canWrite(): boolean {
        return this.props.canWrite;
    }

    get canExecute(): boolean {
        return this.props.canExecute;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Check if this is a global permission
     */
    isGlobal(): boolean {
        return this.props.tenantId === null || this.props.tenantId === undefined;
    }

    /**
     * Grant a specific permission
     */
    grantPermission(action: PermissionAction): void {
        switch (action) {
            case PermissionAction.READ:
                this.props.canRead = true;
                break;
            case PermissionAction.WRITE:
                this.props.canWrite = true;
                break;
            case PermissionAction.EXECUTE:
                this.props.canExecute = true;
                break;
        }
        this.props.updatedAt = new Date();
    }

    /**
     * Revoke a specific permission
     */
    revokePermission(action: PermissionAction): void {
        switch (action) {
            case PermissionAction.READ:
                this.props.canRead = false;
                break;
            case PermissionAction.WRITE:
                this.props.canWrite = false;
                break;
            case PermissionAction.EXECUTE:
                this.props.canExecute = false;
                break;
        }
        this.props.updatedAt = new Date();
    }

    /**
     * Check if a specific action is allowed
     */
    hasPermission(action: PermissionAction): boolean {
        switch (action) {
            case PermissionAction.READ:
                return this.props.canRead;
            case PermissionAction.WRITE:
                return this.props.canWrite;
            case PermissionAction.EXECUTE:
                return this.props.canExecute;
            default:
                return false;
        }
    }

    /**
     * Check if any permission is granted
     */
    hasAnyPermission(): boolean {
        return this.props.canRead || this.props.canWrite || this.props.canExecute;
    }

    /**
     * Check if all permissions are granted
     */
    hasFullPermission(): boolean {
        return this.props.canRead && this.props.canWrite && this.props.canExecute;
    }

    /**
     * Grant all permissions
     */
    grantAllPermissions(): void {
        this.props.canRead = true;
        this.props.canWrite = true;
        this.props.canExecute = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Revoke all permissions
     */
    revokeAllPermissions(): void {
        this.props.canRead = false;
        this.props.canWrite = false;
        this.props.canExecute = false;
        this.props.updatedAt = new Date();
    }

    toPersistence(): RolePermissionProps {
        return { ...this.props };
    }
}
