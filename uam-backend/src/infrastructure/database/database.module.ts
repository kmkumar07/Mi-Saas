import { Module, Global } from '@nestjs/common';
import { databaseProviders } from './database.provider';
import { IdentityRepository } from './repositories/identity.repository';
import { AuthenticationAccountRepository } from './repositories/authentication-account.repository';
import { OrganizationMemberRepository } from './repositories/organization-member.repository';
import { OrganizationAdminRepository } from './repositories/organization-admin.repository';
import { ProductAccessGrantRepository } from './repositories/product-access-grant.repository';
import { UserRepository } from './repositories/user.repository';
import { SystemRoleRepository } from './repositories/system-role.repository';
import { MemberRoleRepository } from './repositories/user-role.repository';
import { EmployeeInvitationRepository } from './repositories/employee-invitation.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { OAuthTokenRepository } from './repositories/oauth-token.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

/**
 * Database Module
 * Provides database connection and repository implementations
 * Global module - available throughout the application
 */
@Global()
@Module({
    providers: [
        ...databaseProviders,
        {
            provide: 'IIdentityRepository',
            useClass: IdentityRepository,
        },
        {
            provide: 'IAuthenticationAccountRepository',
            useClass: AuthenticationAccountRepository,
        },
        {
            provide: 'IOrganizationMemberRepository',
            useClass: OrganizationMemberRepository,
        },
        {
            provide: 'IOrganizationAdminRepository',
            useClass: OrganizationAdminRepository,
        },
        {
            provide: 'IProductAccessGrantRepository',
            useClass: ProductAccessGrantRepository,
        },
        {
            provide: 'IUserRepository',
            useClass: UserRepository,
        },
        {
            provide: 'ISystemRoleRepository',
            useClass: SystemRoleRepository,
        },
        {
            provide: 'IMemberRoleRepository',
            useClass: MemberRoleRepository,
        },
        {
            provide: 'IEmployeeInvitationRepository',
            useClass: EmployeeInvitationRepository,
        },
        {
            provide: 'IRolePermissionRepository',
            useClass: RolePermissionRepository,
        },
        {
            provide: 'IOAuthTokenRepository',
            useClass: OAuthTokenRepository,
        },
        {
            provide: 'IAuditLogRepository',
            useClass: AuditLogRepository,
        },
    ],
    exports: [
        ...databaseProviders,
        'IIdentityRepository',
        'IAuthenticationAccountRepository',
        'IOrganizationMemberRepository',
        'IOrganizationAdminRepository',
        'IProductAccessGrantRepository',
        'IUserRepository',
        'ISystemRoleRepository',
        'IMemberRoleRepository',
        'IEmployeeInvitationRepository',
        'IRolePermissionRepository',
        'IOAuthTokenRepository',
        'IAuditLogRepository',
    ],
})
export class DatabaseModule { }
