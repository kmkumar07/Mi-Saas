import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IOrganizationAdminRepository } from '../../../domain/repositories/organization-admin.repository.interface';
import { OrganizationAdmin } from '../../../domain/entities/organization-admin.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * Organization Admin Repository Implementation
 * Implements IOrganizationAdminRepository using Drizzle ORM
 * 
 * CRITICAL: Organization admins MUST also be organization_members (enforced by FK).
 * Admin status is additive and does NOT bypass RBAC.
 */
@Injectable()
export class OrganizationAdminRepository implements IOrganizationAdminRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<OrganizationAdmin | null> {
        const result = await this.db
            .select()
            .from(schema.organizationAdmins)
            .where(eq(schema.organizationAdmins.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByOrganizationMemberId(organizationMemberId: string): Promise<OrganizationAdmin | null> {
        const result = await this.db
            .select()
            .from(schema.organizationAdmins)
            .where(eq(schema.organizationAdmins.organizationMemberId, organizationMemberId))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByTenantId(tenantId: string): Promise<OrganizationAdmin[]> {
        const results = await this.db
            .select()
            .from(schema.organizationAdmins)
            .where(eq(schema.organizationAdmins.tenantId, tenantId));

        return results.map(row => this.toDomain(row));
    }

    async existsByOrganizationMemberId(organizationMemberId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.organizationAdmins.id })
            .from(schema.organizationAdmins)
            .where(eq(schema.organizationAdmins.organizationMemberId, organizationMemberId))
            .limit(1);

        return result.length > 0;
    }

    async existsByOrganizationMemberIdAndTenantId(organizationMemberId: string, tenantId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.organizationAdmins.id })
            .from(schema.organizationAdmins)
            .where(
                and(
                    eq(schema.organizationAdmins.organizationMemberId, organizationMemberId),
                    eq(schema.organizationAdmins.tenantId, tenantId)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    async create(admin: OrganizationAdmin): Promise<OrganizationAdmin> {
        const persistence = admin.toPersistence();

        const result = await this.db
            .insert(schema.organizationAdmins)
            .values({
                id: persistence.id,
                organizationMemberId: persistence.organizationMemberId,
                tenantId: persistence.tenantId,
                grantedBy: persistence.grantedBy,
                grantedAt: persistence.grantedAt,
                createdAt: persistence.createdAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.organizationAdmins)
            .where(eq(schema.organizationAdmins.id, id));
    }

    async deleteByOrganizationMemberId(organizationMemberId: string): Promise<void> {
        await this.db
            .delete(schema.organizationAdmins)
            .where(eq(schema.organizationAdmins.organizationMemberId, organizationMemberId));
    }

    private toDomain(row: typeof schema.organizationAdmins.$inferSelect): OrganizationAdmin {
        return OrganizationAdmin.fromPersistence({
            id: row.id,
            organizationMemberId: row.organizationMemberId,
            tenantId: row.tenantId,
            grantedBy: row.grantedBy,
            grantedAt: row.grantedAt,
            createdAt: row.createdAt,
        });
    }
}

