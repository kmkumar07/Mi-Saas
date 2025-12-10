import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../../../domain/repositories/subscription.repository';
import { IUsageEventRepository, USAGE_EVENT_REPOSITORY } from '../../../domain/repositories/usage-event.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/repositories';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { IPlanFeatureConfigRepository, PLAN_FEATURE_CONFIG_REPOSITORY } from '@domain/repositories/plan-feature-config.repository';
import { EntitlementsResponseDto, UsageEntry } from '../../dtos/usage.dto';
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
        // Format: features as Record<string, boolean> and usage as Record<string, { used: number, limit: number }>
        const features: Record<string, boolean> = {};
        const usage: Record<string, UsageEntry> = {};

        for (const feature of allFeatures) {
            // Convert feature code to uppercase to match user's expected format (e.g., "ATTACHMENTS", "AI_TODO")
            const featureCode = feature.code.toUpperCase();

            // Find configs for this feature across all active plans
            const configsForFeature = planFeatureConfigs.filter(cfg => cfg.featureId === feature.id);
            const anyActive = configsForFeature.some(cfg => cfg.isAvailable());

            if (!anyActive) {
                // Feature is not enabled in any plan
                features[featureCode] = false;
                continue;
            }

            const primaryConfig = configsForFeature[0];
            const isEnabled = primaryConfig.isActive;

            // Set feature enabled/disabled status
            features[featureCode] = isEnabled;

            // Handle QUOTA features - add to usage with limit
            if (feature.featureType === FeatureType.QUOTA) {
                const limit = primaryConfig.quotaLimit || 0;
                const usageData = aggregatedUsage.find(u => u.featureCode.toLowerCase() === feature.code.toLowerCase());
                const used = usageData?.totalQuantity || 0;

                usage[featureCode] = {
                    used,
                    limit,
                };
            }

            // Handle METERED features - add to usage if there's a limit
            if (feature.featureType === FeatureType.METERED) {
                const usageData = aggregatedUsage.find(u => u.featureCode.toLowerCase() === feature.code.toLowerCase());
                const used = usageData?.totalQuantity || 0;

                // For metered features, check if there's a quota limit or calculate from pricing model
                let limit: number | undefined;
                
                // If there's a quota limit, use it
                if (primaryConfig.quotaLimit) {
                    limit = primaryConfig.quotaLimit;
                } else if (primaryConfig.pricingModel) {
                    const pricingModel = primaryConfig.pricingModel;
                    
                    // For tiered/graduated pricing, use the highest tier's toQuantity as the limit
                    if ('tiers' in pricingModel && pricingModel.tiers.length > 0) {
                        const highestTier = pricingModel.tiers
                            .filter(tier => tier.toQuantity !== null && tier.toQuantity !== undefined)
                            .sort((a, b) => (b.toQuantity || 0) - (a.toQuantity || 0))[0];
                        
                        if (highestTier) {
                            limit = highestTier.toQuantity || undefined;
                        }
                    }
                    // For volume pricing, use the highest volume's maxVolume as the limit
                    else if ('volumes' in pricingModel && pricingModel.volumes.length > 0) {
                        const highestVolume = pricingModel.volumes
                            .filter(volume => volume.maxVolume !== null && volume.maxVolume !== undefined)
                            .sort((a, b) => (b.maxVolume || 0) - (a.maxVolume || 0))[0];
                        
                        if (highestVolume) {
                            limit = highestVolume.maxVolume || undefined;
                        }
                    }
                    // Per-user and per-usage pricing don't have usage limits
                }

                // Only add to usage if there's a limit
                if (limit !== undefined) {
                    usage[featureCode] = {
                        used,
                        limit,
                    };
                }
            }
        }

        return {
            features,
            usage,
        };
    }
}
