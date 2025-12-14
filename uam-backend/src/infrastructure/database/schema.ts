import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, unique, inet, jsonb, index, integer, pgSchema } from 'drizzle-orm/pg-core';

// ============================
// UAM SCHEMA
// ============================

export const uamSchema = pgSchema('uam');

// ============================
// ENUMS
// ============================

export const accountTypeEnum = uamSchema.enum('account_type', ['individual', 'company']);

export const authProviderEnum = uamSchema.enum('auth_provider', ['local', 'azure_ad']);

export const authenticationProviderEnum = uamSchema.enum('authentication_provider', [
    'local',
    'azure_ad',
    'google',
    'cognito',
]);

export const invitationStatusEnum = uamSchema.enum('invitation_status', [
    'pending',
    'accepted',
    'expired',
    'revoked',
]);

// ============================
// UAM SCHEMA TABLES
// ============================

/**
 * Identities Table
 * Global human identity - represents a person across all tenants
 * This is the foundation of the identity layer in the permission model
 */
export const identities = uamSchema.table(
    'identities',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        firstName: varchar('first_name', { length: 100 }),
        lastName: varchar('last_name', { length: 100 }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        emailIdx: index('idx_identities_email').on(table.email),
    })
);

/**
 * Authentication Accounts Table
 * Login methods per identity - supports multiple auth providers per identity
 * This separates authentication from identity, allowing one person to have multiple login methods
 */
export const authenticationAccounts = uamSchema.table(
    'authentication_accounts',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        identityId: uuid('identity_id').notNull().references(() => identities.id, { onDelete: 'cascade' }),
        provider: authenticationProviderEnum('provider').notNull(),
        providerAccountId: varchar('provider_account_id', { length: 255 }), // External provider ID
        email: varchar('email', { length: 255 }).notNull(), // May differ from identity.email
        passwordHash: varchar('password_hash', { length: 255 }), // Only for local provider
        externalId: varchar('external_id', { length: 255 }), // Azure AD Object ID, etc.
        isActive: boolean('is_active').default(true).notNull(),
        isEmailVerified: boolean('is_email_verified').default(false).notNull(),
        lastLoginAt: timestamp('last_login_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueIdentityProvider: unique().on(table.identityId, table.provider, table.providerAccountId),
        identityIdx: index('idx_auth_accounts_identity').on(table.identityId),
        emailIdx: index('idx_auth_accounts_email').on(table.email),
        providerIdx: index('idx_auth_accounts_provider').on(table.provider),
    })
);

/**
 * Organization Members Table
 * Baseline membership - identity ↔ tenant relationship
 * This is the REQUIRED layer for all access. No actor can access tenant resources without being a member.
 * The JWT sub claim will be organization_members.id (tenant-scoped)
 */
export const organizationMembers = uamSchema.table(
    'organization_members',
    {
        id: uuid('id').primaryKey().defaultRandom(), // This becomes the JWT sub claim
        identityId: uuid('identity_id').notNull().references(() => identities.id, { onDelete: 'cascade' }),
        tenantId: uuid('tenant_id').notNull(), // FK to subscription.tenants (cross-schema)
        isActive: boolean('is_active').default(true).notNull(),
        joinedAt: timestamp('joined_at').defaultNow().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueIdentityTenant: unique().on(table.identityId, table.tenantId),
        identityIdx: index('idx_org_members_identity').on(table.identityId),
        tenantIdx: index('idx_org_members_tenant').on(table.tenantId),
    })
);

/**
 * Organization Admins Table
 * Tenant-level administrative authority - grants full administrative control over a tenant
 * This is an ADDITIVE layer on top of organization_members. Admins MUST also be members.
 * Admin status grants tenant governance (billing, member management, IdP config) but does NOT bypass RBAC.
 */
export const organizationAdmins = uamSchema.table(
    'organization_admins',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationMemberId: uuid('organization_member_id')
            .notNull()
            .references(() => organizationMembers.id, { onDelete: 'cascade' })
            .unique(), // One admin record per member
        tenantId: uuid('tenant_id').notNull(), // Denormalized for efficient queries
        grantedBy: uuid('granted_by').references(() => organizationMembers.id, { onDelete: 'set null' }),
        grantedAt: timestamp('granted_at').defaultNow().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        tenantIdx: index('idx_org_admins_tenant').on(table.tenantId),
        memberIdx: index('idx_org_admins_member').on(table.organizationMemberId),
    })
);

/**
 * Product Access Grants Table
 * Product-level access control - determines which products an identity can access within a tenant
 * This is an ADDITIVE layer that grants scope control. Product access is checked before RBAC.
 * Product owners MUST also be organization_members.
 */
export const productAccessGrants = uamSchema.table(
    'product_access_grants',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationMemberId: uuid('organization_member_id')
            .notNull()
            .references(() => organizationMembers.id, { onDelete: 'cascade' }),
        productId: uuid('product_id').notNull(), // FK to subscription.products (cross-schema)
        tenantId: uuid('tenant_id').notNull(), // Denormalized for efficient queries
        grantedBy: uuid('granted_by').references(() => organizationMembers.id, { onDelete: 'set null' }),
        grantedAt: timestamp('granted_at').defaultNow().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueMemberProduct: unique().on(table.organizationMemberId, table.productId),
        memberIdx: index('idx_product_access_member').on(table.organizationMemberId),
        productIdx: index('idx_product_access_product').on(table.productId),
        tenantIdx: index('idx_product_access_tenant').on(table.tenantId),
    })
);

/**
 * Service User Involvement Roles Table
 * (renamed from system_roles)
 * Stores predefined system roles and tenant-specific custom roles
 * tenant_id = NULL for global system roles
 */
export const systemRoles = uamSchema.table(
    'roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id'), // NULL for global roles
        roleCode: varchar('role_code', { length: 50 }).notNull(),
        roleName: varchar('role_name', { length: 100 }).notNull(),
        description: text('description'),
        isSystemRole: boolean('is_system_role').default(true).notNull(),
        hierarchyLevel: integer('hierarchy_level').notNull(), // 1=highest, 4=lowest
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueRoleCodePerTenant: unique().on(table.tenantId, table.roleCode),
        tenantIdx: index('idx_system_roles_tenant').on(table.tenantId),
        codeIdx: index('idx_system_roles_code').on(table.roleCode),
    })
);

/**
 * Users Table
 * Stores user accounts with authentication and account type information
 */
export const users = uamSchema.table(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id').notNull(), // FK to subscription.tenants

        // Authentication
        email: varchar('email', { length: 255 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        authProvider: authProviderEnum('auth_provider').default('local').notNull(),
        externalId: varchar('external_id', { length: 255 }), // Azure AD Object ID

        // Profile
        firstName: varchar('first_name', { length: 100 }),
        lastName: varchar('last_name', { length: 100 }),

        // Account Status
        isActive: boolean('is_active').default(false).notNull(),
        isEmailVerified: boolean('is_email_verified').default(false).notNull(),

        // Account Type (FUTURE)
        accountType: accountTypeEnum('account_type').default('individual'),
        organizationId: uuid('organization_id'), // FUTURE: FK to organizations
        isCompanyOwner: boolean('is_company_owner').default(false).notNull(),

        // Azure AD Sync (FUTURE)
        isSyncedFromAd: boolean('is_synced_from_ad').default(false).notNull(),
        lastSyncedAt: timestamp('last_synced_at'),
        emailDomain: varchar('email_domain', { length: 255 }),

        // Timestamps
        lastLoginAt: timestamp('last_login_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueEmailPerTenant: unique().on(table.tenantId, table.email),
        tenantIdx: index('idx_users_tenant').on(table.tenantId),
        emailIdx: index('idx_users_email').on(table.email),
        emailDomainIdx: index('idx_users_email_domain').on(table.emailDomain),
        authProviderIdx: index('idx_users_auth_provider').on(table.authProvider),
    })
);

/**
 * Member Roles Table
 * Junction table linking organization_members to roles
 * RENAMED from user_roles to reflect new permission model
 * RBAC subject is always organization_members.id, never identity.id
 */
export const memberRoles = uamSchema.table(
    'member_roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationMemberId: uuid('organization_member_id')
            .notNull()
            .references(() => organizationMembers.id, { onDelete: 'cascade' }),
        roleId: uuid('role_id').notNull().references(() => systemRoles.id, { onDelete: 'cascade' }),
        // Optional product scope for the member-role assignment
        productId: uuid('product_id'),
        assignedBy: uuid('assigned_by').references(() => organizationMembers.id, { onDelete: 'set null' }),
        assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueMemberRole: unique().on(table.organizationMemberId, table.roleId),
        memberIdx: index('idx_member_roles_member').on(table.organizationMemberId),
        roleIdx: index('idx_member_roles_role').on(table.roleId),
        productIdx: index('idx_member_roles_product').on(table.productId),
    })
);

/**
 * Role Permissions Table
 * Defines granular permissions (read/write/execute) for each role-feature combination
 */
export const rolePermissions = uamSchema.table(
    'role_permissions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id'), // NULL for global permissions
        roleId: uuid('role_id').notNull().references(() => systemRoles.id, { onDelete: 'cascade' }),
        featureId: uuid('feature_id').notNull(), // FK to subscription.features (cross-schema)
        canRead: boolean('can_read').default(false).notNull(),
        canWrite: boolean('can_write').default(false).notNull(),
        canExecute: boolean('can_execute').default(false).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueRoleFeaturePerTenant: unique().on(table.tenantId, table.roleId, table.featureId),
        tenantIdx: index('idx_role_permissions_tenant').on(table.tenantId),
        roleIdx: index('idx_role_permissions_role').on(table.roleId),
        featureIdx: index('idx_role_permissions_feature').on(table.featureId),
    })
);

/**
 * Employee Invitations Table
 * Manages employee invitation workflow
 */
export const employeeInvitations = uamSchema.table(
    'employee_invitations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id').notNull(), // FK to subscription.tenants
        email: varchar('email', { length: 255 }).notNull(),
        invitedBy: uuid('invited_by').references(() => organizationMembers.id, { onDelete: 'set null' }),
        invitationToken: varchar('invitation_token', { length: 255 }).unique().notNull(),
        roleIds: uuid('role_ids').array().notNull(), // Array of role IDs
        status: invitationStatusEnum('status').default('pending').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        acceptedAt: timestamp('accepted_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        uniquePendingInvitation: unique().on(table.tenantId, table.email, table.status),
        tenantIdx: index('idx_invitations_tenant').on(table.tenantId),
        tokenIdx: index('idx_invitations_token').on(table.invitationToken),
        statusIdx: index('idx_invitations_status').on(table.status),
    })
);

/**
 * Audit Logs Table
 * Tracks all user actions for compliance and security
 */
export const auditLogs = uamSchema.table(
    'audit_logs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationMemberId: uuid('organization_member_id').references(() => organizationMembers.id, { onDelete: 'set null' }),
        tenantId: uuid('tenant_id').notNull(), // FK to subscription.tenants
        action: varchar('action', { length: 100 }).notNull(), // e.g., 'user.created'
        resourceType: varchar('resource_type', { length: 50 }).notNull(), // e.g., 'user', 'role'
        resourceId: uuid('resource_id'),
        ipAddress: inet('ip_address'),
        userAgent: text('user_agent'),
        metadata: jsonb('metadata'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        memberIdx: index('idx_audit_logs_member').on(table.organizationMemberId),
        tenantIdx: index('idx_audit_logs_tenant').on(table.tenantId),
        actionIdx: index('idx_audit_logs_action').on(table.action),
        createdIdx: index('idx_audit_logs_created').on(table.createdAt),
    })
);

/**
 * OAuth Tokens Table
 * Stores OAuth2 access and refresh tokens
 */
export const oauthTokens = uamSchema.table(
    'oauth_tokens',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        organizationMemberId: uuid('organization_member_id').notNull().references(() => organizationMembers.id, { onDelete: 'cascade' }),
        accessToken: text('access_token').unique().notNull(),
        refreshToken: text('refresh_token').unique(),
        tokenType: varchar('token_type', { length: 20 }).default('Bearer').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        refreshExpiresAt: timestamp('refresh_expires_at'),
        scope: text('scope'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        revokedAt: timestamp('revoked_at'),
    },
    (table) => ({
        memberIdx: index('idx_oauth_tokens_member').on(table.organizationMemberId),
        accessIdx: index('idx_oauth_tokens_access').on(table.accessToken),
        refreshIdx: index('idx_oauth_tokens_refresh').on(table.refreshToken),
    })
);

/**
 * OAuth2 Clients Table
 * Stores OAuth2 client applications that can request authorization
 */
export const oauthClients = uamSchema.table(
    'oauth_clients',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clientId: varchar('client_id', { length: 255 }).unique().notNull(),
        clientSecretHash: varchar('client_secret_hash', { length: 255 }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        redirectUris: text('redirect_uris').array().notNull(), // Array of redirect URIs
        scopes: text('scopes').array().notNull(), // Array of allowed scopes
        grantTypes: text('grant_types').array().notNull(), // Array of grant types (authorization_code, client_credentials, refresh_token)
        tenantId: uuid('tenant_id').notNull(), // FK to subscription.tenants (cross-schema)
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        clientIdIdx: index('idx_oauth_clients_client_id').on(table.clientId),
        tenantIdx: index('idx_oauth_clients_tenant').on(table.tenantId),
    })
);

/**
 * OAuth2 Authorization Codes Table
 * Stores temporary authorization codes for authorization code flow
 */
export const oauthAuthorizationCodes = uamSchema.table(
    'oauth_authorization_codes',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        code: varchar('code', { length: 255 }).unique().notNull(),
        clientId: varchar('client_id', { length: 255 }).notNull(),
        organizationMemberId: uuid('organization_member_id').notNull().references(() => organizationMembers.id, { onDelete: 'cascade' }),
        redirectUri: varchar('redirect_uri', { length: 500 }).notNull(),
        scopes: text('scopes').array().notNull(), // Array of requested scopes
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        codeIdx: index('idx_oauth_auth_codes_code').on(table.code),
        clientIdx: index('idx_oauth_auth_codes_client').on(table.clientId),
        memberIdx: index('idx_oauth_auth_codes_member').on(table.organizationMemberId),
    })
);

// ============================
// TYPE EXPORTS
// ============================

export type Identity = typeof identities.$inferSelect;
export type NewIdentity = typeof identities.$inferInsert;

export type AuthenticationAccount = typeof authenticationAccounts.$inferSelect;
export type NewAuthenticationAccount = typeof authenticationAccounts.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type OrganizationAdmin = typeof organizationAdmins.$inferSelect;
export type NewOrganizationAdmin = typeof organizationAdmins.$inferInsert;

export type ProductAccessGrant = typeof productAccessGrants.$inferSelect;
export type NewProductAccessGrant = typeof productAccessGrants.$inferInsert;

export type SystemRole = typeof systemRoles.$inferSelect;
export type NewSystemRole = typeof systemRoles.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MemberRole = typeof memberRoles.$inferSelect;
export type NewMemberRole = typeof memberRoles.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;
export type NewEmployeeInvitation = typeof employeeInvitations.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;

export type OAuthClient = typeof oauthClients.$inferSelect;
export type NewOAuthClient = typeof oauthClients.$inferInsert;

export type OAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferSelect;
export type NewOAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferInsert;
