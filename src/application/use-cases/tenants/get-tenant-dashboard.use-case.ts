import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    ITenantRepository,
    TENANT_REPOSITORY,
    ISubscriptionRepository,
    SUBSCRIPTION_REPOSITORY,
    IPlanRepository,
    PLAN_REPOSITORY,
    IFeatureRepository,
    FEATURE_REPOSITORY,
    IUsageEventRepository,
    USAGE_EVENT_REPOSITORY,
    IPlanFeatureConfigRepository,
    PLAN_FEATURE_CONFIG_REPOSITORY,
} from '@domain/repositories';
import { TenantDashboardDto, FeatureUsageDto } from '../../dtos/tenant-dashboard.dto';
import { SubscriptionResponseDto } from '../../dtos/subscription-response.dto';
import { PlanResponseDto } from '../../dtos/plan-response.dto';
import { GetPlanUseCase } from '../plans/get-plan.use-case';

@Injectable()
export class GetTenantDashboardUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(USAGE_EVENT_REPOSITORY)
        private readonly usageEventRepository: IUsageEventRepository,
        @Inject(PLAN_FEATURE_CONFIG_REPOSITORY)
        private readonly planFeatureConfigRepository: IPlanFeatureConfigRepository,
        private readonly getPlanUseCase: GetPlanUseCase,
    ) { }

    async execute(tenantId: string): Promise<TenantDashboardDto> {
        // 1. Get tenant
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
        }

        // 2. Get all subscriptions for this tenant
        const allSubscriptions = await this.subscriptionRepository.findByTenantId(tenantId);

        // Get active subscriptions by tenant (status = 'active')
        const activeSubscriptions = await this.subscriptionRepository.findActiveByTenantAndCustomer(tenantId);

        // Get subscriptions that should show features (active, trial, incomplete)
        const subscriptionsForFeatures = allSubscriptions.filter(
            sub => sub.status === 'active' || sub.status === 'trial' || sub.status === 'incomplete'
        );

        // 3. Get plans for all subscriptions (for display purposes)
        const allPlanIds = [...new Set(allSubscriptions.map(sub => sub.planId))];
        const allPlanDetails = await Promise.all(
            allPlanIds.map(async (planId) => {
                try {
                    return await this.getPlanUseCase.execute(planId);
                } catch (err) {
                    console.error(`Failed to get plan ${planId}:`, err);
                    return null;
                }
            })
        );
        const plans = allPlanDetails.filter(p => p !== null) as PlanResponseDto[];

        // 4. Get feature usage - ONLY use active subscriptions (like entitlements endpoint)
        const featureUsage: FeatureUsageDto[] = [];
        
        // Only calculate feature usage if there are active subscriptions
        if (activeSubscriptions.length > 0) {
            // Get plan IDs from ACTIVE subscriptions only
            const activePlanIds = [...new Set(activeSubscriptions.map(sub => sub.planId))];
            const activePlanDetails = await Promise.all(
                activePlanIds.map(async (planId) => {
                    try {
                        return await this.getPlanUseCase.execute(planId);
                    } catch (err) {
                        console.error(`Failed to get plan ${planId}:`, err);
                        return null;
                    }
                })
            );
            const activePlans = activePlanDetails.filter(p => p !== null) as PlanResponseDto[];

            if (activePlans.length > 0) {
                // Get all product IDs from active plans only
                const productIds = new Set<string>();
                for (const plan of activePlans) {
                    if (plan.products) {
                        plan.products.forEach(product => productIds.add(product.id));
                    }
                }

                // Get all features for these products
                const allFeatures: any[] = [];
                for (const productId of productIds) {
                    const features = await this.featureRepository.findByProductId(productId);
                    allFeatures.push(...features);
                }

                // Get current usage for the billing period
                const now = new Date();
                const periodStart = activeSubscriptions[0]?.currentPeriodStart || new Date();
                const aggregatedUsage = await this.usageEventRepository.getAggregatedUsage(
                    tenantId,
                    undefined, // customerId is optional
                    periodStart,
                    now
                );

                // Get plan feature configs from ACTIVE plans only
                const planFeatureConfigs = await this.planFeatureConfigRepository.findByPlanIds(activePlanIds);

                // Convert aggregated usage array to a map for easy lookup
                const usageMap = new Map<string, number>();
                for (const usage of aggregatedUsage) {
                    usageMap.set(usage.featureCode.toUpperCase(), usage.totalQuantity);
                }

                // Build feature usage array
                for (const feature of allFeatures) {
                    // Find configs for this feature from active plans
                    const configsForFeature = planFeatureConfigs.filter(cfg => cfg.featureId === feature.id);
                    
                    // Use the first available config (prioritize active ones)
                    const config = configsForFeature.find(cfg => cfg.isAvailable()) || configsForFeature[0];

                    const used = usageMap.get(feature.code.toUpperCase()) || 0;
                    const limit = config?.quotaLimit;
                    const isUnlimited = limit === null || limit === undefined;

                    featureUsage.push({
                        featureId: feature.id!,
                        featureName: feature.name,
                        featureCode: feature.code,
                        featureDescription: feature.description,
                        used,
                        limit: limit,
                        isUnlimited,
                        featureType: feature.featureType,
                    });
                }
            }
        }

        // 5. Map subscriptions to DTOs
        const subscriptionDtos: SubscriptionResponseDto[] = allSubscriptions.map(sub => ({
            id: sub.id,
            accountId: sub.accountId,
            tenantId: sub.tenantId,
            customerId: sub.customerId,
            planId: sub.planId,
            status: sub.status,
            seats: sub.seats,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelledAt: sub.cancelledAt,
            cancellationReason: sub.cancellationReason,
            metadata: sub.metadata,
            createdAt: sub.createdAt,
        }));

        // Count subscriptions that are active or trial (not incomplete/cancelled)
        const activeOrTrialCount = allSubscriptions.filter(
            sub => sub.status === 'active' || sub.status === 'trial'
        ).length;

        return {
            tenantId: tenant.id!,
            tenantName: tenant.name,
            subscriptions: subscriptionDtos,
            plans,
            featureUsage,
            totalFeatures: featureUsage.length,
            activeSubscriptions: activeOrTrialCount,
        };
    }
}

