export enum AccountType {
    INDIVIDUAL = 'individual',
    COMPANY = 'company',
}

export enum AuthProvider {
    LOCAL = 'local',
    AZURE_AD = 'azure_ad',
}

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    EXPIRED = 'expired',
    REVOKED = 'revoked',
}

export enum SystemRoleCode {
    SUPER_ADMIN = 'super_admin',
    FULL_AUTHORITY = 'full_authority',
    PRODUCT_OWNER = 'product_owner',
    TENANT_ADMIN = 'tenant_admin',
}

export enum PermissionAction {
    READ = 'read',
    WRITE = 'write',
    EXECUTE = 'execute',
}

export enum AuditAction {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_ACTIVATED = 'user.activated',
    USER_DEACTIVATED = 'user.deactivated',
    ROLE_ASSIGNED = 'role.assigned',
    ROLE_REVOKED = 'role.revoked',
    PERMISSION_GRANTED = 'permission.granted',
    PERMISSION_REVOKED = 'permission.revoked',
    INVITATION_SENT = 'invitation.sent',
    INVITATION_ACCEPTED = 'invitation.accepted',
    INVITATION_REVOKED = 'invitation.revoked',
    LOGIN_SUCCESS = 'login.success',
    LOGIN_FAILED = 'login.failed',
    LOGOUT = 'logout',
    TOKEN_REFRESHED = 'token.refreshed',
}
