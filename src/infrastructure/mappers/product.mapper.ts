import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities/product.entity';

/**
 * Maps Product domain entity to/from database representation
 */
@Injectable()
export class ProductMapper {
    /**
     * Converts Product domain entity to database row format
     */
    toPersistence(product: Product): {
        id: string;
        tenantId: string;
        name: string;
        description?: string;
        apiKey?: string;
        active: boolean;
        metadata?: Record<string, any>;
        createdAt?: Date;
    } {
        return {
            id: product.id,
            tenantId: product.tenantId,
            name: product.name,
            description: product.description,
            apiKey: product.apiKey,
            active: product.active,
            metadata: product.metadata,
            createdAt: product.createdAt,
        };
    }

    /**
     * Converts database row to Product domain entity
     */
    toDomain(row: any): Product {
        return new Product({
            id: row.id,
            tenantId: row.tenantId,
            name: row.name,
            description: row.description,
            apiKey: row.apiKey,
            active: row.active,
            metadata: row.metadata,
            createdAt: row.createdAt,
        });
    }
}
