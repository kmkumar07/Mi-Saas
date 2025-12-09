import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { Feature } from '@domain/entities';
import { IFeatureRepository } from '@domain/repositories';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class FeatureRepository implements IFeatureRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async create(feature: Feature): Promise<Feature> {
        const result = await this.db
            .insert(schema.features)
            .values({
                productId: feature.productId,
                name: feature.name,
                code: feature.code,
                description: feature.description,
                featureType: feature.featureType,
                chargeModel: feature.chargeModel,
                serviceUrl: feature.serviceUrl,
                metadata: feature.metadata,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async findById(id: string): Promise<Feature | null> {
        const result = await this.db
            .select()
            .from(schema.features)
            .where(eq(schema.features.id, id))
            .limit(1);

        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByProductId(productId: string): Promise<Feature[]> {
        const results = await this.db
            .select()
            .from(schema.features)
            .where(eq(schema.features.productId, productId));

        return results.map((row) => this.toDomain(row));
    }

    async findAll(): Promise<Feature[]> {
        const results = await this.db.select().from(schema.features);
        return results.map((row) => this.toDomain(row));
    }

    async update(feature: Feature): Promise<Feature> {
        if (!feature.id) {
            throw new Error('Cannot update feature without ID');
        }

        const result = await this.db
            .update(schema.features)
            .set({
                name: feature.name,
                description: feature.description,
                featureType: feature.featureType,
                chargeModel: feature.chargeModel,
                serviceUrl: feature.serviceUrl,
                metadata: feature.metadata,
            })
            .where(eq(schema.features.id, feature.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(schema.features).where(eq(schema.features.id, id));
    }

    private toDomain(row: schema.Feature): Feature {
        return new Feature({
            id: row.id,
            productId: row.productId,
            name: row.name,
            code: row.code,
            description: row.description ?? undefined,
            featureType: row.featureType as any,
            chargeModel: row.chargeModel as any,
            serviceUrl: row.serviceUrl ?? undefined,
            metadata: row.metadata as Record<string, any>,
            createdAt: row.createdAt,
        });
    }
}
