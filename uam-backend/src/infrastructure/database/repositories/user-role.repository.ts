import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IUserRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { UserRole } from '../../../domain/entities/user-role.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

@Injectable()
export class UserRoleRepository implements IUserRoleRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<UserRole | null> {
        const result = await this.db
            .select()
            .from(schema.userRoles)
            .where(eq(schema.userRoles.id, id))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByUserId(userId: string): Promise<UserRole[]> {
        const results = await this.db
            .select()
            .from(schema.userRoles)
            .where(eq(schema.userRoles.userId, userId));
        return results.map(row => this.toDomain(row));
    }

    async findByUserIdAndRoleId(userId: string, roleId: string): Promise<UserRole | null> {
        const result = await this.db
            .select()
            .from(schema.userRoles)
            .where(
                and(
                    eq(schema.userRoles.userId, userId),
                    eq(schema.userRoles.roleId, roleId)
                )
            )
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async create(userRole: UserRole): Promise<UserRole> {
        const persistence = userRole.toPersistence();
        const result = await this.db
            .insert(schema.userRoles)
            .values(persistence as any)
            .returning();
        return this.toDomain(result[0]);
    }

    async bulkCreate(userRoles: UserRole[]): Promise<UserRole[]> {
        if (userRoles.length === 0) {
            return [];
        }
        const persistenceData = userRoles.map(ur => ur.toPersistence());
        const results = await this.db
            .insert(schema.userRoles)
            .values(persistenceData as any)
            .returning();
        return results.map(row => this.toDomain(row));
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.userRoles)
            .where(eq(schema.userRoles.id, id));
    }

    async deleteByUserIdAndRoleId(userId: string, roleId: string): Promise<void> {
        await this.db
            .delete(schema.userRoles)
            .where(
                and(
                    eq(schema.userRoles.userId, userId),
                    eq(schema.userRoles.roleId, roleId)
                )
            );
    }

    private toDomain(row: typeof schema.userRoles.$inferSelect): UserRole {
        return UserRole.fromPersistence({
            id: row.id,
            userId: row.userId,
            roleId: row.roleId,
            assignedBy: row.assignedBy,
            assignedAt: row.assignedAt,
        });
    }
}
