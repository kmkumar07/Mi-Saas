import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IProductAccessGrantRepository } from '../../../domain/repositories/product-access-grant.repository.interface';
import { ProductAccessGrant } from '../../../domain/entities/product-access-grant.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * Product Access Grant Repository Implementation
 * Implements IProductAccessGrantRepository using Drizzle ORM
 * 
 * CRITICAL: Product access grants MUST also have organization_membership (enforced by FK).
 * Product access is additive and determines scope, but does NOT bypass RBAC.
 */
@Injectable()
export class ProductAccessGrantRepository implements IProductAccessGrantRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<ProductAccessGrant | null> {
        const result = await this.db
            .select()
            .from(schema.productAccessGrants)
            .where(eq(schema.productAccessGrants.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByOrganizationMemberId(organizationMemberId: string): Promise<ProductAccessGrant[]> {
        const results = await this.db
            .select()
            .from(schema.productAccessGrants)
            .where(eq(schema.productAccessGrants.organizationMemberId, organizationMemberId));

        return results.map(row => this.toDomain(row));
    }

    async findByProductId(productId: string): Promise<ProductAccessGrant[]> {
        const results = await this.db
            .select()
            .from(schema.productAccessGrants)
            .where(eq(schema.productAccessGrants.productId, productId));

        return results.map(row => this.toDomain(row));
    }

    async findByTenantId(tenantId: string): Promise<ProductAccessGrant[]> {
        const results = await this.db
            .select()
            .from(schema.productAccessGrants)
            .where(eq(schema.productAccessGrants.tenantId, tenantId));

        return results.map(row => this.toDomain(row));
    }

    async findByOrganizationMemberIdAndProductId(organizationMemberId: string, productId: string): Promise<ProductAccessGrant | null> {
        const result = await this.db
            .select()
            .from(schema.productAccessGrants)
            .where(
                and(
                    eq(schema.productAccessGrants.organizationMemberId, organizationMemberId),
                    eq(schema.productAccessGrants.productId, productId)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByOrganizationMemberIdAndTenantId(organizationMemberId: string, tenantId: string): Promise<ProductAccessGrant[]> {
        const results = await this.db
            .select()
            .from(schema.productAccessGrants)
            .where(
                and(
                    eq(schema.productAccessGrants.organizationMemberId, organizationMemberId),
                    eq(schema.productAccessGrants.tenantId, tenantId)
                )
            );

        return results.map(row => this.toDomain(row));
    }

    async existsByOrganizationMemberIdAndProductId(organizationMemberId: string, productId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.productAccessGrants.id })
            .from(schema.productAccessGrants)
            .where(
                and(
                    eq(schema.productAccessGrants.organizationMemberId, organizationMemberId),
                    eq(schema.productAccessGrants.productId, productId)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    async existsByOrganizationMemberIdAndProductIdAndTenantId(organizationMemberId: string, productId: string, tenantId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.productAccessGrants.id })
            .from(schema.productAccessGrants)
            .where(
                and(
                    eq(schema.productAccessGrants.organizationMemberId, organizationMemberId),
                    eq(schema.productAccessGrants.productId, productId),
                    eq(schema.productAccessGrants.tenantId, tenantId)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    async create(grant: ProductAccessGrant): Promise<ProductAccessGrant> {
        const persistence = grant.toPersistence();

        const result = await this.db
            .insert(schema.productAccessGrants)
            .values({
                id: persistence.id,
                organizationMemberId: persistence.organizationMemberId,
                productId: persistence.productId,
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
            .delete(schema.productAccessGrants)
            .where(eq(schema.productAccessGrants.id, id));
    }

    async deleteByOrganizationMemberIdAndProductId(organizationMemberId: string, productId: string): Promise<void> {
        await this.db
            .delete(schema.productAccessGrants)
            .where(
                and(
                    eq(schema.productAccessGrants.organizationMemberId, organizationMemberId),
                    eq(schema.productAccessGrants.productId, productId)
                )
            );
    }

    private toDomain(row: typeof schema.productAccessGrants.$inferSelect): ProductAccessGrant {
        return ProductAccessGrant.fromPersistence({
            id: row.id,
            organizationMemberId: row.organizationMemberId,
            productId: row.productId,
            tenantId: row.tenantId,
            grantedBy: row.grantedBy,
            grantedAt: row.grantedAt,
            createdAt: row.createdAt,
        });
    }
}

