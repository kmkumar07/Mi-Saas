import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { ISystemRoleRepository } from '../../../domain/repositories/system-role.repository.interface';
import { SystemRole } from '../../../domain/entities/system-role.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

@Injectable()
export class SystemRoleRepository implements ISystemRoleRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<SystemRole | null> {
        const result = await this.db.select().from(schema.systemRoles).where(eq(schema.systemRoles.id, id)).limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByCode(code: string, tenantId?: string): Promise<SystemRole | null> {
        const result = await this.db.select().from(schema.systemRoles).where(eq(schema.systemRoles.roleCode, code)).limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByTenantId(tenantId: string): Promise<SystemRole[]> {
        const results = await this.db.select().from(schema.systemRoles).where(eq(schema.systemRoles.tenantId, tenantId));
        return results.map(row => this.toDomain(row));
    }

    async findAll(tenantId?: string | null): Promise<SystemRole[]> {
        if (tenantId) {
            return this.findByTenantId(tenantId);
        }
        return this.findGlobalRoles();
    }

    async findGlobalRoles(): Promise<SystemRole[]> {
        const results = await this.db.select().from(schema.systemRoles);
        return results.map(row => this.toDomain(row));
    }

    async create(role: SystemRole): Promise<SystemRole> {
        const persistence = role.toPersistence();
        const result = await this.db.insert(schema.systemRoles).values(persistence as any).returning();
        return this.toDomain(result[0]);
    }

    async update(role: SystemRole): Promise<SystemRole> {
        const persistence = role.toPersistence();
        const result = await this.db.update(schema.systemRoles).set(persistence as any).where(eq(schema.systemRoles.id, persistence.id)).returning();
        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(schema.systemRoles).where(eq(schema.systemRoles.id, id));
    }

    private toDomain(row: typeof schema.systemRoles.$inferSelect): SystemRole {
        return SystemRole.fromPersistence({
            id: row.id,
            tenantId: row.tenantId,
            roleCode: row.roleCode,
            roleName: row.roleName,
            description: row.description,
            isSystemRole: row.isSystemRole,
            hierarchyLevel: row.hierarchyLevel,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
