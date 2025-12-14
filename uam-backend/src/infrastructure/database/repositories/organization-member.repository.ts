import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';
import { OrganizationMember } from '../../../domain/entities/organization-member.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * Organization Member Repository Implementation
 * Implements IOrganizationMemberRepository using Drizzle ORM
 * 
 * CRITICAL: This repository manages the baseline membership requirement.
 * All authorization checks must start with verifying organization membership.
 * The JWT sub claim is organization_members.id (tenant-scoped).
 */
@Injectable()
export class OrganizationMemberRepository implements IOrganizationMemberRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<OrganizationMember | null> {
        const result = await this.db
            .select()
            .from(schema.organizationMembers)
            .where(eq(schema.organizationMembers.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByIdentityId(identityId: string): Promise<OrganizationMember[]> {
        const results = await this.db
            .select()
            .from(schema.organizationMembers)
            .where(eq(schema.organizationMembers.identityId, identityId));

        return results.map(row => this.toDomain(row));
    }

    async findByTenantId(tenantId: string): Promise<OrganizationMember[]> {
        const results = await this.db
            .select()
            .from(schema.organizationMembers)
            .where(eq(schema.organizationMembers.tenantId, tenantId));

        return results.map(row => this.toDomain(row));
    }

    async findByIdentityIdAndTenantId(identityId: string, tenantId: string): Promise<OrganizationMember | null> {
        const result = await this.db
            .select()
            .from(schema.organizationMembers)
            .where(
                and(
                    eq(schema.organizationMembers.identityId, identityId),
                    eq(schema.organizationMembers.tenantId, tenantId)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findActiveById(id: string): Promise<OrganizationMember | null> {
        const result = await this.db
            .select()
            .from(schema.organizationMembers)
            .where(
                and(
                    eq(schema.organizationMembers.id, id),
                    eq(schema.organizationMembers.isActive, true)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findActiveByIdentityIdAndTenantId(identityId: string, tenantId: string): Promise<OrganizationMember | null> {
        const result = await this.db
            .select()
            .from(schema.organizationMembers)
            .where(
                and(
                    eq(schema.organizationMembers.identityId, identityId),
                    eq(schema.organizationMembers.tenantId, tenantId),
                    eq(schema.organizationMembers.isActive, true)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async create(member: OrganizationMember): Promise<OrganizationMember> {
        const persistence = member.toPersistence();

        const result = await this.db
            .insert(schema.organizationMembers)
            .values({
                id: persistence.id,
                identityId: persistence.identityId,
                tenantId: persistence.tenantId,
                isActive: persistence.isActive,
                joinedAt: persistence.joinedAt,
                createdAt: persistence.createdAt,
                updatedAt: persistence.updatedAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async update(member: OrganizationMember): Promise<OrganizationMember> {
        const persistence = member.toPersistence();

        const result = await this.db
            .update(schema.organizationMembers)
            .set({
                isActive: persistence.isActive,
                updatedAt: new Date(),
            })
            .where(eq(schema.organizationMembers.id, persistence.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.organizationMembers)
            .where(eq(schema.organizationMembers.id, id));
    }

    async existsByIdentityIdAndTenantId(identityId: string, tenantId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.organizationMembers.id })
            .from(schema.organizationMembers)
            .where(
                and(
                    eq(schema.organizationMembers.identityId, identityId),
                    eq(schema.organizationMembers.tenantId, tenantId)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    private toDomain(row: typeof schema.organizationMembers.$inferSelect): OrganizationMember {
        return OrganizationMember.fromPersistence({
            id: row.id,
            identityId: row.identityId,
            tenantId: row.tenantId,
            isActive: row.isActive,
            joinedAt: row.joinedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

