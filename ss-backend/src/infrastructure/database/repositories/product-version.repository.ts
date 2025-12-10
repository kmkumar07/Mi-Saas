import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, and } from 'drizzle-orm';
import { ProductVersion } from '@domain/entities/product-version.entity';
import { IProductVersionRepository, PRODUCT_VERSION_REPOSITORY } from '@domain/repositories/product-version.repository.interface';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class ProductVersionRepository implements IProductVersionRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async create(productVersion: ProductVersion): Promise<ProductVersion> {
        const result = await this.db
            .insert(schema.productVersions)
            .values({
                id: productVersion.id,
                productId: productVersion.productId,
                version: productVersion.version,
                name: productVersion.name,
                description: productVersion.description,
                apiKey: productVersion.apiKey,
                active: productVersion.active,
                metadata: productVersion.metadata,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async findById(id: string): Promise<ProductVersion | null> {
        const result = await this.db
            .select()
            .from(schema.productVersions)
            .where(eq(schema.productVersions.id, id))
            .limit(1);

        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByProductId(productId: string): Promise<ProductVersion[]> {
        const results = await this.db
            .select()
            .from(schema.productVersions)
            .where(eq(schema.productVersions.productId, productId))
            .orderBy(desc(schema.productVersions.version));

        return results.map((row) => this.toDomain(row));
    }

    async findByProductIdAndVersion(productId: string, version: number): Promise<ProductVersion | null> {
        const results = await this.db
            .select()
            .from(schema.productVersions)
            .where(
                and(
                    eq(schema.productVersions.productId, productId),
                    eq(schema.productVersions.version, version),
                ),
            )
            .limit(1);

        return results.length > 0 ? this.toDomain(results[0]) : null;
    }

    async findLatestVersion(productId: string): Promise<ProductVersion | null> {
        const results = await this.db
            .select()
            .from(schema.productVersions)
            .where(eq(schema.productVersions.productId, productId))
            .orderBy(desc(schema.productVersions.version))
            .limit(1);

        return results.length > 0 ? this.toDomain(results[0]) : null;
    }

    private toDomain(row: schema.ProductVersion): ProductVersion {
        return new ProductVersion({
            id: row.id,
            productId: row.productId,
            version: row.version,
            name: row.name,
            description: row.description ?? undefined,
            apiKey: row.apiKey ?? undefined,
            active: row.active,
            metadata: row.metadata as Record<string, any>,
            createdAt: row.createdAt,
        });
    }
}

