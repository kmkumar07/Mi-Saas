import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../../../domain/repositories/subscription.repository';
import { IUsageEventRepository, USAGE_EVENT_REPOSITORY } from '../../../domain/repositories/usage-event.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/repositories';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { IPlanFeatureConfigRepository, PLAN_FEATURE_CONFIG_REPOSITORY } from '@domain/repositories/plan-feature-config.repository';
import { EntitlementsResponseDto, FeatureEntitlement, UsageInfo, FeaturePricingTierInfo } from '../../dtos/usage.dto';
import { FeatureType } from '@domain/enums';

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
        @Inject(PLAN_FEATURE_CONFIG_REPOSITORY)
        private readonly planFeatureConfigRepository: IPlanFeatureConfigRepository,
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

        // 5. Load per-plan feature configuration and pricing tiers
        const planFeatureConfigs = await this.planFeatureConfigRepository.findByPlanIds(planIds);

        // 6. Build entitlements response
        const features: Record<string, FeatureEntitlement> = {};
        const usage: Record<string, UsageInfo> = {};

        for (const feature of allFeatures) {
            const featureCode = feature.code;

            // Find configs for this feature across all active plans
            const configsForFeature = planFeatureConfigs.filter(cfg => cfg.featureId === feature.id);
            const anyActive = configsForFeature.some(cfg => cfg.isAvailable());

            if (!anyActive) {
                continue;
            }

            const primaryConfig = configsForFeature[0];

            if (feature.featureType === FeatureType.BOOLEAN) {
                features[featureCode] = {
                    enabled: true,
                };
            }

            if (feature.featureType === FeatureType.QUOTA) {
                const limit = primaryConfig.quotaLimit;
                features[featureCode] = {
                    enabled: true,
                    limit,
                };
            }

            if (feature.featureType === FeatureType.METERED) {
                const usageData = aggregatedUsage.find(u => u.featureCode === featureCode);
                const used = usageData?.totalQuantity || 0;

                const pricingTiers: FeaturePricingTierInfo[] = primaryConfig.pricingTiers.map(tier => ({
                    fromQuantity: tier.fromQuantity,
                    toQuantity: tier.toQuantity ?? null,
                    pricePerUnit: tier.pricePerUnit,
                    currency: tier.currency,
                }));

                usage[featureCode] = {
                    used,
                };

                features[featureCode] = {
                    enabled: true,
                    pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
                };
            }
        }

        return {
            features,
            usage,
        };
    }
}
