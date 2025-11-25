import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../../../domain/repositories/subscription.repository';
import { IUsageEventRepository, USAGE_EVENT_REPOSITORY } from '../../../domain/repositories/usage-event.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/repositories';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { EntitlementsResponseDto, FeatureEntitlement, UsageInfo } from '../../dtos/usage.dto';

@Injectable()
export class GetEntitlementsUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(USAGE_EVENT_REPOSITORY)
        private readonly usageEventRepository: IUsageEventRepository,
    ) { }

    async execute(tenantId: string, customerId?: string): Promise<EntitlementsResponseDto> {
        // 1. Find active subscriptions for this tenant/customer
        const subscriptions = await this.subscriptionRepository.findActiveByTenantAndCustomer(
            tenantId,
            customerId
        );

        if (subscriptions.length === 0) {
            throw new NotFoundException('No active subscriptions found');
        }

        // 2. Get all plans for these subscriptions
        const planIds = subscriptions.map(sub => sub.planId);
        const plans = await Promise.all(
            planIds.map(planId => this.planRepository.findById(planId))
        );

        // 3. Get all product IDs from plans
        const productIds = new Set<string>();
        for (const plan of plans) {
            if (plan) {
                plan.productIds.forEach((id: string) => productIds.add(id));
            }
        }

        // 4. Get all features for these products
        const allFeatures: any[] = [];
        for (const productId of productIds) {
            const features = await this.featureRepository.findByProductId(productId);
            allFeatures.push(...features);
        }

        // 5. Get current usage for this customer
        const now = new Date();
        const periodStart = subscriptions[0]?.currentPeriodStart || new Date();
        const aggregatedUsage = await this.usageEventRepository.getAggregatedUsage(
            tenantId,
            customerId,
            periodStart,
            now
        );

        // 6. Build entitlements response
        const features: Record<string, FeatureEntitlement> = {};
        const usage: Record<string, UsageInfo> = {};

        for (const feature of allFeatures) {
            const featureCode = feature.code;

            // Boolean features
            if (feature.featureType === 'boolean') {
                features[featureCode] = {
                    enabled: true,
                };
            }

            // Quota features
            if (feature.featureType === 'quota') {
                const limit = feature.metadata?.max || feature.metadata?.limit;
                features[featureCode] = {
                    enabled: true,
                    limit,
                };
            }

            // Metered features
            if (feature.featureType === 'metered') {
                const usageData = aggregatedUsage.find(u => u.featureCode === featureCode);
                const used = usageData?.totalQuantity || 0;
                const limit = feature.metadata?.limit || feature.metadata?.max;

                usage[featureCode] = {
                    used,
                    limit,
                };
            }
        }

        return {
            features,
            usage,
        };
    }
}
