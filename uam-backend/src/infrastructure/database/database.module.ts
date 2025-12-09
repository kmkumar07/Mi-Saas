import { Module, Global } from '@nestjs/common';
import { databaseProviders } from './database.provider';
import { UserRepository } from './repositories/user.repository';
import { SystemRoleRepository } from './repositories/system-role.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
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
            provide: 'IUserRepository',
            useClass: UserRepository,
        },
        {
            provide: 'ISystemRoleRepository',
            useClass: SystemRoleRepository,
        },
        {
            provide: 'IUserRoleRepository',
            useClass: UserRoleRepository,
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
        'IUserRepository',
        'ISystemRoleRepository',
        'IUserRoleRepository',
        'IEmployeeInvitationRepository',
        'IRolePermissionRepository',
        'IOAuthTokenRepository',
        'IAuditLogRepository',
    ],
})
export class DatabaseModule { }
