import { AuditAction } from '../enums';

export interface AuditLogProps {
    id: string;
    userId?: string | null;
    tenantId: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: Date;
}

/**
 * AuditLog Entity
 * Records user actions for compliance and security auditing
 * Immutable once created - audit logs should never be modified
 */
export class AuditLog {
    private constructor(private readonly props: AuditLogProps) { }

    static create(props: Omit<AuditLogProps, 'id' | 'createdAt'>): AuditLog {
        return new AuditLog({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
        });
    }

    static fromPersistence(props: AuditLogProps): AuditLog {
        return new AuditLog(props);
    }

    get id(): string {
        return this.props.id;
    }

    get userId(): string | null | undefined {
        return this.props.userId;
    }

    get tenantId(): string {
        return this.props.tenantId;
    }

    get action(): AuditAction {
        return this.props.action;
    }

    get resourceType(): string {
        return this.props.resourceType;
    }

    get resourceId(): string | null | undefined {
        return this.props.resourceId;
    }

    get ipAddress(): string | null | undefined {
        return this.props.ipAddress;
    }

    get userAgent(): string | null | undefined {
        return this.props.userAgent;
    }

    get metadata(): Record<string, any> | null | undefined {
        return this.props.metadata;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    /**
     * Check if this is a system action (no user)
     */
    isSystemAction(): boolean {
        return this.props.userId === null || this.props.userId === undefined;
    }

    /**
     * Check if this is a user action
     */
    isUserAction(): boolean {
        return !this.isSystemAction();
    }

    /**
     * Check if action is related to authentication
     */
    isAuthAction(): boolean {
        return [
            AuditAction.LOGIN_SUCCESS,
            AuditAction.LOGIN_FAILED,
            AuditAction.LOGOUT,
            AuditAction.TOKEN_REFRESHED,
        ].includes(this.props.action);
    }

    /**
     * Check if action is related to user management
     */
    isUserManagementAction(): boolean {
        return [
            AuditAction.USER_CREATED,
            AuditAction.USER_UPDATED,
            AuditAction.USER_ACTIVATED,
            AuditAction.USER_DEACTIVATED,
        ].includes(this.props.action);
    }

    /**
     * Check if action is related to role management
     */
    isRoleManagementAction(): boolean {
        return [
            AuditAction.ROLE_ASSIGNED,
            AuditAction.ROLE_REVOKED,
        ].includes(this.props.action);
    }

    /**
     * Check if action is related to permission management
     */
    isPermissionManagementAction(): boolean {
        return [
            AuditAction.PERMISSION_GRANTED,
            AuditAction.PERMISSION_REVOKED,
        ].includes(this.props.action);
    }

    /**
     * Check if action is related to invitations
     */
    isInvitationAction(): boolean {
        return [
            AuditAction.INVITATION_SENT,
            AuditAction.INVITATION_ACCEPTED,
            AuditAction.INVITATION_REVOKED,
        ].includes(this.props.action);
    }

    /**
     * Get metadata value by key
     */
    getMetadataValue(key: string): any {
        if (!this.props.metadata) {
            return undefined;
        }
        return this.props.metadata[key];
    }

    toPersistence(): AuditLogProps {
        return { ...this.props };
    }
}
