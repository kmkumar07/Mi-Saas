import { Injectable } from '@nestjs/common';
import { GetTenantDashboardUseCase } from '@application/use-cases/tenants/get-tenant-dashboard.use-case';
import { TenantFeaturesResponseDto, InternalProductDto, InternalFeatureDto } from '../dtos/tenant-features-response.dto';

/**
 * Use case for getting tenant features for internal service consumption
 * Used by UAM service to fetch available features for permission assignment
 * Features are grouped by product for better organization in the UI
 */
@Injectable()
export class GetTenantFeaturesUseCase {
    constructor(
        private readonly getTenantDashboardUseCase: GetTenantDashboardUseCase,
    ) { }

    async execute(tenantId: string): Promise<TenantFeaturesResponseDto> {
        // Reuse dashboard use case to get all tenant data with proper relationships loaded
        const dashboard = await this.getTenantDashboardUseCase.execute(tenantId);

        // Build products with their features from plans
        const productsMap = new Map<string, InternalProductDto>();

        for (const plan of dashboard.plans) {
            if (plan.products) {
                for (const product of plan.products) {
                    // Skip if product already processed
                    if (productsMap.has(product.id)) {
                        continue;
                    }

                    // Get features for this product from featureUsage
                    const productFeatures: InternalFeatureDto[] = [];

                    if (product.features) {
                        for (const planFeature of product.features) {
                            // Find matching feature in featureUsage to get the full details
                            const featureUsage = dashboard.featureUsage.find(f => f.featureId === planFeature.id);

                            if (featureUsage) {
                                productFeatures.push({
                                    featureId: featureUsage.featureId,
                                    featureName: featureUsage.featureName,
                                    featureCode: featureUsage.featureCode,
                                    featureDescription: featureUsage.featureDescription,
                                    featureType: featureUsage.featureType,
                                });
                            }
                        }
                    }

                    // Add product with its features
                    if (productFeatures.length > 0) {
                        productsMap.set(product.id, {
                            productId: product.id,
                            productName: product.name,
                            features: productFeatures,
                        });
                    }
                }
            }
        }

        const products = Array.from(productsMap.values());
        const totalFeatures = products.reduce((sum, p) => sum + p.features.length, 0);

        return {
            tenantId,
            products,
            totalFeatures,
            activeSubscriptions: dashboard.activeSubscriptions,
        };
    }
}
