import { Injectable } from '@nestjs/common';
import { Feature } from '@domain/entities/feature.entity';

/**
 * Maps Feature domain entity to/from database representation
 */
@Injectable()
export class FeatureMapper {
    /**
     * Converts Feature domain entity to database row format
     */
    toPersistence(feature: Feature): {
        id: string;
        productId: string;
        name: string;
        code: string;
        description?: string;
        featureType: string;
        chargeModel: string;
        serviceUrl?: string;
        metadata?: Record<string, any>;
        createdAt?: Date;
    } {
        return {
            id: feature.id,
            productId: feature.productId,
            name: feature.name,
            code: feature.code,
            description: feature.description,
            featureType: feature.featureType,
            chargeModel: feature.chargeModel,
            serviceUrl: feature.serviceUrl,
            metadata: feature.metadata,
            createdAt: feature.createdAt,
        };
    }

    /**
     * Converts database row to Feature domain entity
     */
    toDomain(row: any): Feature {
        return new Feature({
            id: row.id,
            productId: row.productId,
            name: row.name,
            code: row.code,
            description: row.description,
            featureType: row.featureType,
            chargeModel: row.chargeModel,
            serviceUrl: row.serviceUrl,
            metadata: row.metadata,
            createdAt: row.createdAt,
        });
    }
}
