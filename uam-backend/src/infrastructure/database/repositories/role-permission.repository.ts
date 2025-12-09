import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IRolePermissionRepository } from '../../../domain/repositories/role-permission.repository.interface';
import { RolePermission } from '../../../domain/entities/role-permission.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

@Injectable()
export class RolePermissionRepository implements IRolePermissionRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<RolePermission | null> {
        const result = await this.db
            .select()
            .from(schema.rolePermissions)
            .where(eq(schema.rolePermissions.id, id))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByRoleId(roleId: string): Promise<RolePermission[]> {
        const results = await this.db
            .select()
            .from(schema.rolePermissions)
            .where(eq(schema.rolePermissions.roleId, roleId));
        return results.map(row => this.toDomain(row));
    }

    async findByRoleAndFeature(roleId: string, featureId: string): Promise<RolePermission | null> {
        const result = await this.db
            .select()
            .from(schema.rolePermissions)
            .where(
                and(
                    eq(schema.rolePermissions.roleId, roleId),
                    eq(schema.rolePermissions.featureId, featureId)
                )
            )
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByTenantId(tenantId: string): Promise<RolePermission[]> {
        const results = await this.db
            .select()
            .from(schema.rolePermissions)
            .where(eq(schema.rolePermissions.tenantId, tenantId));
        return results.map(row => this.toDomain(row));
    }

    async create(permission: RolePermission): Promise<RolePermission> {
        const persistence = permission.toPersistence();
        const result = await this.db
            .insert(schema.rolePermissions)
            .values(persistence as any)
            .returning();
        return this.toDomain(result[0]);
    }

    async bulkCreate(permissions: RolePermission[]): Promise<RolePermission[]> {
        if (permissions.length === 0) {
            return [];
        }
        const persistenceData = permissions.map(p => p.toPersistence());
        const results = await this.db
            .insert(schema.rolePermissions)
            .values(persistenceData as any)
            .returning();
        return results.map(row => this.toDomain(row));
    }

    async update(permission: RolePermission): Promise<RolePermission> {
        const persistence = permission.toPersistence();
        const result = await this.db
            .update(schema.rolePermissions)
            .set(persistence as any)
            .where(eq(schema.rolePermissions.id, persistence.id))
            .returning();
        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.rolePermissions)
            .where(eq(schema.rolePermissions.id, id));
    }

    async deleteByRoleId(roleId: string): Promise<void> {
        await this.db
            .delete(schema.rolePermissions)
            .where(eq(schema.rolePermissions.roleId, roleId));
    }

    private toDomain(row: typeof schema.rolePermissions.$inferSelect): RolePermission {
        return RolePermission.fromPersistence({
            id: row.id,
            tenantId: row.tenantId,
            roleId: row.roleId,
            featureId: row.featureId,
            canRead: row.canRead,
            canWrite: row.canWrite,
            canExecute: row.canExecute,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
