import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsageEvent } from '../../../domain/entities/usage-event.entity';
import { IUsageEventRepository, USAGE_EVENT_REPOSITORY } from '../../../domain/repositories/usage-event.repository';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../../../domain/repositories/subscription.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { IPlanFeatureConfigRepository, PLAN_FEATURE_CONFIG_REPOSITORY } from '@domain/repositories/plan-feature-config.repository';
import { RecordUsageDto, RecordUsageResponseDto } from '../../dtos/usage.dto';
import { FeatureType } from '@domain/enums';

@Injectable()
export class RecordUsageUseCase {
    constructor(
        @Inject(USAGE_EVENT_REPOSITORY)
        private readonly usageEventRepository: IUsageEventRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(PLAN_FEATURE_CONFIG_REPOSITORY)
        private readonly planFeatureConfigRepository: IPlanFeatureConfigRepository,
    ) { }

    async execute(dto: RecordUsageDto): Promise<RecordUsageResponseDto> {
        const featureCodeLower = dto.featureCode.toLowerCase();

        // 1. Find the feature by code
        const allFeatures = await this.featureRepository.findAll();
        const feature = allFeatures.find(f => f.code.toLowerCase() === featureCodeLower);
        
        if (!feature) {
            throw new NotFoundException(`Feature with code '${dto.featureCode}' not found`);
        }

        // 2. Find active subscriptions for this tenant/customer
        const subscriptions = await this.subscriptionRepository.findActiveByTenantAndCustomer(
            dto.tenantId,
            dto.customerId
        );

        if (subscriptions.length === 0) {
            throw new NotFoundException('No active subscriptions found');
        }

        // 3. Get plans and feature configs
        const planIds = subscriptions.map(sub => sub.planId);
        const plans = await Promise.all(
            planIds.map(planId => this.planRepository.findById(planId))
        );

        const planFeatureConfigs = await this.planFeatureConfigRepository.findByPlanIds(planIds);
        const configsForFeature = planFeatureConfigs.filter(cfg => cfg.featureId === feature.id);
        
        if (configsForFeature.length === 0 || !configsForFeature.some(cfg => cfg.isAvailable())) {
            throw new BadRequestException(`Feature '${dto.featureCode}' is not available in any active plan`);
        }

        const primaryConfig = configsForFeature[0];

        // 4. Get current usage
        const now = new Date();
        const periodStart = subscriptions[0]?.currentPeriodStart || new Date();
        const aggregatedUsage = await this.usageEventRepository.getAggregatedUsage(
            dto.tenantId,
            dto.customerId,
            periodStart,
            now
        );

        const usageData = aggregatedUsage.find(u => u.featureCode.toLowerCase() === featureCodeLower);
        const currentUsed = usageData?.totalQuantity || 0;
        const newTotalUsed = currentUsed + dto.usage;

        // 5. Check limits (only for QUOTA and METERED features with limits)
        let limit: number | null = null;
        let limitExceeded = false;

        if (feature.featureType === FeatureType.QUOTA) {
            limit = primaryConfig.quotaLimit || null;
            if (limit !== null && newTotalUsed > limit) {
                limitExceeded = true;
            }
        } else if (feature.featureType === FeatureType.METERED) {
            if (primaryConfig.quotaLimit) {
                limit = primaryConfig.quotaLimit;
                if (newTotalUsed > limit) {
                    limitExceeded = true;
                }
            } else if (primaryConfig.pricingModel) {
                // Check limits based on pricing model type
                const pricingModel = primaryConfig.pricingModel;
                
                // For tiered/graduated pricing, check highest tier
                if ('tiers' in pricingModel && pricingModel.tiers.length > 0) {
                    const highestTier = pricingModel.tiers
                        .filter(tier => tier.toQuantity !== null && tier.toQuantity !== undefined)
                        .sort((a, b) => (b.toQuantity || 0) - (a.toQuantity || 0))[0];
                    
                    if (highestTier) {
                        limit = highestTier.toQuantity || null;
                        if (limit !== null && newTotalUsed > limit) {
                            limitExceeded = true;
                        }
                    }
                }
                // For volume pricing, check highest volume
                else if ('volumes' in pricingModel && pricingModel.volumes.length > 0) {
                    const highestVolume = pricingModel.volumes
                        .filter(volume => volume.maxVolume !== null && volume.maxVolume !== undefined)
                        .sort((a, b) => (b.maxVolume || 0) - (a.maxVolume || 0))[0];
                    
                    if (highestVolume) {
                        limit = highestVolume.maxVolume || null;
                        if (limit !== null && newTotalUsed > limit) {
                            limitExceeded = true;
                        }
                    }
                }
                // Per-user and per-usage pricing don't have usage limits
            }
        }

        // 6. If limit exceeded, do NOT record a new usage event.
        //    Instead, return a structured response indicating the limit has been hit.
        if (limitExceeded) {
            return {
                featureCode: dto.featureCode.toUpperCase(),
                // No additional usage is recorded when the limit is exceeded
                usage: 0,
                // Total used stays at the previously recorded value
                totalUsed: currentUsed,
                limit: limit,
                limitExceeded: true,
                remaining: limit !== null ? Math.max(0, limit - currentUsed) : null,
            };
        }

        // 7. Create usage event entity
        const usageEvent = new UsageEvent({
            tenantId: dto.tenantId,
            customerId: dto.customerId,
            featureCode: featureCodeLower,
            quantity: dto.usage,
            idempotencyKey: dto.idempotencyKey,
        });

        // 8. Repository will handle idempotency check
        await this.usageEventRepository.create(usageEvent);

        // 9. Return response
        return {
            featureCode: dto.featureCode.toUpperCase(),
            usage: dto.usage,
            totalUsed: newTotalUsed,
            limit: limit,
            limitExceeded: false,
            remaining: limit !== null ? Math.max(0, limit - newTotalUsed) : null,
        };
    }
}
