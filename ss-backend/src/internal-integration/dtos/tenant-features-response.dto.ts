import { ApiProperty } from '@nestjs/swagger';

/**
 * Feature information for internal service consumption
 * Simplified version without usage data
 */
export class InternalFeatureDto {
    @ApiProperty({ description: 'Feature ID' })
    featureId: string;

    @ApiProperty({ description: 'Feature name' })
    featureName: string;

    @ApiProperty({ description: 'Feature code' })
    featureCode: string;

    @ApiProperty({ description: 'Feature description', required: false })
    featureDescription?: string;

    @ApiProperty({ description: 'Feature type (boolean, quota, metered)' })
    featureType: string;
}

/**
 * Product with its features
 */
export class InternalProductDto {
    @ApiProperty({ description: 'Product ID' })
    productId: string;

    @ApiProperty({ description: 'Product name' })
    productName: string;

    @ApiProperty({ description: 'Features belonging to this product', type: [InternalFeatureDto] })
    features: InternalFeatureDto[];
}

/**
 * Response DTO for tenant features endpoint
 * Used by UAM service to get available features for permission assignment
 * Features are grouped by product for better organization
 */
export class TenantFeaturesResponseDto {
    @ApiProperty({ description: 'Tenant ID' })
    tenantId: string;

    @ApiProperty({ description: 'Products with their features', type: [InternalProductDto] })
    products: InternalProductDto[];

    @ApiProperty({ description: 'Total number of features across all products' })
    totalFeatures: number;

    @ApiProperty({ description: 'Number of active subscriptions' })
    activeSubscriptions: number;
}
