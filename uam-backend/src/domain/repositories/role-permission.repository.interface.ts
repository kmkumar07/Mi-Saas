import { RolePermission } from '../entities/role-permission.entity';

/**
 * RolePermission Repository Interface
 * Defines contract for role permission persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 */
export interface IRolePermissionRepository {
    findById(id: string): Promise<RolePermission | null>;
    findByRoleId(roleId: string): Promise<RolePermission[]>;
    findByRoleAndFeature(roleId: string, featureId: string): Promise<RolePermission | null>;
    findByTenantId(tenantId: string): Promise<RolePermission[]>;
    create(permission: RolePermission): Promise<RolePermission>;
    bulkCreate(permissions: RolePermission[]): Promise<RolePermission[]>;
    update(permission: RolePermission): Promise<RolePermission>;
    delete(id: string): Promise<void>;
    deleteByRoleId(roleId: string): Promise<void>;
}
