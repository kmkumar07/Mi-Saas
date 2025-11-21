import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { Product } from '@domain/entities';
import { IProductRepository } from '@domain/repositories';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class ProductRepository implements IProductRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async create(product: Product): Promise<Product> {
        const result = await this.db
            .insert(schema.products)
            .values({
                tenantId: product.tenantId,
                name: product.name,
                description: product.description,
                apiKey: product.apiKey,
                active: product.active,
                metadata: product.metadata,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async findById(id: string): Promise<Product | null> {
        const result = await this.db
            .select()
            .from(schema.products)
            .where(eq(schema.products.id, id))
            .limit(1);

        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByTenantId(tenantId: string): Promise<Product[]> {
        const results = await this.db
            .select()
            .from(schema.products)
            .where(eq(schema.products.tenantId, tenantId));

        return results.map((row) => this.toDomain(row));
    }

    async findAll(): Promise<Product[]> {
        const results = await this.db.select().from(schema.products);
        return results.map((row) => this.toDomain(row));
    }

    async update(product: Product): Promise<Product> {
        if (!product.id) {
            throw new Error('Cannot update product without ID');
        }

        const result = await this.db
            .update(schema.products)
            .set({
                name: product.name,
                description: product.description,
                apiKey: product.apiKey,
                active: product.active,
                metadata: product.metadata,
            })
            .where(eq(schema.products.id, product.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(schema.products).where(eq(schema.products.id, id));
    }

    private toDomain(row: schema.Product): Product {
        return new Product({
            id: row.id,
            tenantId: row.tenantId,
            name: row.name,
            description: row.description ?? undefined,
            apiKey: row.apiKey ?? undefined,
            active: row.active,
            metadata: row.metadata as Record<string, any>,
            createdAt: row.createdAt,
        });
    }
}
