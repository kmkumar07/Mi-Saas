import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IMemberRoleRepository } from '../../../domain/repositories/user-role.repository.interface';
import { MemberRole } from '../../../domain/entities/user-role.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * Member Role Repository Implementation
 * RENAMED from UserRoleRepository to reflect new permission model
 * 
 * CRITICAL: RBAC subject is always organization_members.id, never identity.id
 * This ensures RBAC is tenant-scoped and respects the membership requirement.
 */
@Injectable()
export class MemberRoleRepository implements IMemberRoleRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<MemberRole | null> {
        const result = await this.db
            .select()
            .from(schema.memberRoles)
            .where(eq(schema.memberRoles.id, id))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByOrganizationMemberId(organizationMemberId: string): Promise<MemberRole[]> {
        const results = await this.db
            .select()
            .from(schema.memberRoles)
            .where(eq(schema.memberRoles.organizationMemberId, organizationMemberId));
        return results.map(row => this.toDomain(row));
    }

    async findByOrganizationMemberIdAndRoleId(organizationMemberId: string, roleId: string): Promise<MemberRole | null> {
        const result = await this.db
            .select()
            .from(schema.memberRoles)
            .where(
                and(
                    eq(schema.memberRoles.organizationMemberId, organizationMemberId),
                    eq(schema.memberRoles.roleId, roleId)
                )
            )
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async create(memberRole: MemberRole): Promise<MemberRole> {
        const persistence = memberRole.toPersistence();
        const result = await this.db
            .insert(schema.memberRoles)
            .values(persistence as any)
            .returning();
        return this.toDomain(result[0]);
    }

    async bulkCreate(memberRoles: MemberRole[]): Promise<MemberRole[]> {
        if (memberRoles.length === 0) {
            return [];
        }
        const persistenceData = memberRoles.map(mr => mr.toPersistence());
        const results = await this.db
            .insert(schema.memberRoles)
            .values(persistenceData as any)
            .returning();
        return results.map(row => this.toDomain(row));
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.memberRoles)
            .where(eq(schema.memberRoles.id, id));
    }

    async deleteByOrganizationMemberIdAndRoleId(organizationMemberId: string, roleId: string): Promise<void> {
        await this.db
            .delete(schema.memberRoles)
            .where(
                and(
                    eq(schema.memberRoles.organizationMemberId, organizationMemberId),
                    eq(schema.memberRoles.roleId, roleId)
                )
            );
    }

    private toDomain(row: typeof schema.memberRoles.$inferSelect): MemberRole {
        return MemberRole.fromPersistence({
            id: row.id,
            organizationMemberId: row.organizationMemberId,
            roleId: row.roleId,
            productId: row.productId,
            assignedBy: row.assignedBy,
            assignedAt: row.assignedAt,
        });
    }
}
