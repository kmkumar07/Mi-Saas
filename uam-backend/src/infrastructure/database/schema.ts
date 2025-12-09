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
 * User Roles Table
 * Junction table linking users to roles
 */
export const userRoles = uamSchema.table(
    'user_roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        roleId: uuid('role_id').notNull().references(() => systemRoles.id, { onDelete: 'cascade' }),
        // Optional product scope for the user-role assignment
        productId: uuid('product_id'),
        assignedBy: uuid('assigned_by').references(() => users.id),
        assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueUserRole: unique().on(table.userId, table.roleId),
        userIdx: index('idx_user_roles_user').on(table.userId),
        roleIdx: index('idx_user_roles_role').on(table.roleId),
        productIdx: index('idx_user_roles_product').on(table.productId),
    })
);

/**
 * Product Involvement Roles Table
 * Links products to roles (cross-schema reference to subscription products)
 */
export const productInvlovemnetRoles = uamSchema.table(
    'product_invlovemnet_roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id'), // NULL for global mappings
        productId: uuid('product_id').notNull(), // FK to subscription.products (cross-schema)
        roleId: uuid('role_id').notNull().references(() => systemRoles.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => ({
        uniqueTenantProductRole: unique().on(table.tenantId, table.productId, table.roleId),
        tenantIdx: index('idx_product_invlovemnet_roles_tenant').on(table.tenantId),
        productIdx: index('idx_product_invlovemnet_roles_product').on(table.productId),
        roleIdx: index('idx_product_invlovemnet_roles_role').on(table.roleId),
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
        invitedBy: uuid('invited_by').references(() => users.id),
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
        userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
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
        userIdx: index('idx_audit_logs_user').on(table.userId),
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
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
        userIdx: index('idx_oauth_tokens_user').on(table.userId),
        accessIdx: index('idx_oauth_tokens_access').on(table.accessToken),
        refreshIdx: index('idx_oauth_tokens_refresh').on(table.refreshToken),
    })
);

// ============================
// TYPE EXPORTS
// ============================

export type SystemRole = typeof systemRoles.$inferSelect;
export type NewSystemRole = typeof systemRoles.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;
export type NewEmployeeInvitation = typeof employeeInvitations.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;
