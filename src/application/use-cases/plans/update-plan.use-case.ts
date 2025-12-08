import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    IPlanRepository,
    PLAN_REPOSITORY,
    IProductRepository,
    PRODUCT_REPOSITORY,
    IFeatureRepository,
    FEATURE_REPOSITORY,
    ISubscriptionRepository,
    SUBSCRIPTION_REPOSITORY,
} from '@domain/repositories';
import { PlanResponseDto } from '../../dtos/plan-response.dto';
import { UpdatePlanDto } from '../../dtos/update-plan.dto';
import { PlanResponseMapper } from '@application/mappers/plan-response.mapper';
import { Plan, PlanFamily, PlanProps } from '@domain/entities';
import { Price, RecurringChargePeriod, RenewalDefinition, TimePeriod } from '@domain/value-objects';
import { PlanPersistenceService, PlanFeatureConfigInput } from '@infrastructure/persistence/plan-persistence.service';
import { Product, Feature } from '@domain/entities';

@Injectable()
export class UpdatePlanUseCase {
    constructor(
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly planResponseMapper: PlanResponseMapper,
        private readonly planPersistenceService: PlanPersistenceService,
    ) { }

    async execute(planId: string, updateDto: UpdatePlanDto): Promise<PlanResponseDto> {
        // Step 1: Load existing plan
        const existingPlan = await this.planRepository.findById(planId);
        if (!existingPlan) {
            throw new NotFoundException(`Plan with ID ${planId} not found`);
        }

        // Step 2: Check if plan is published (immutable)
        // If published, we must create a new version regardless of subscriptions
        const isPublished = existingPlan.isPublished;
        
        // Step 3: Check if plan has active subscriptions (infrastructure concern - querying)
        const activeSubscriptions = await this.subscriptionRepository.findActiveByPlanId(planId);
        const hasActiveSubscriptions = activeSubscriptions.length > 0;

        // Step 4: Handle status changes (publish/unpublish)
        if (updateDto.status !== undefined) {
            if (updateDto.status === 'published' && !isPublished) {
                // Publishing a draft plan - will be handled in persistence
                existingPlan.publish();
            } else if (updateDto.status !== 'published' && isPublished) {
                // Unpublishing a published plan
                existingPlan.unpublish();
            }
        }

        // Step 5: If plan is published, we must create a new version (immutable)
        // Otherwise, use existing logic
        const mustCreateVersion = isPublished || hasActiveSubscriptions;

        // Step 6: Construct aggregate root for plan family
        const planFamily = PlanFamily.fromPlans([existingPlan]);

        // Step 7: Convert DTO to domain changes
        const changes = await this.convertDtoToPlanProps(updateDto, existingPlan);

        // Step 8: Apply updates using aggregate root (business logic)
        const { originalPlan, updatedPlan } = planFamily.updateLatestPlan(
            changes,
            mustCreateVersion,
        );

        // Step 9: Handle products and features (application orchestration)
        let products: Product[] = [];
        let productFeatures: Map<string, Feature[]> = new Map();
        let featureConfigs: PlanFeatureConfigInput[] = [];
        let finalPlan: Plan = updatedPlan;

        // Determine which product IDs to use
        const productIds = updateDto.productIds 
            ? updateDto.productIds 
            : (hasActiveSubscriptions 
                ? updatedPlan.productIds 
                : originalPlan.productIds);

        // Fetch existing products
        products = await Promise.all(
            productIds.map(async (productId) => {
                const product = await this.productRepository.findById(productId);
                if (!product) {
                    throw new NotFoundException(`Product with ID ${productId} not found`);
                }
                return product;
            })
        );

        // Handle feature configurations if provided
        if (updateDto.featureConfigs && updateDto.featureConfigs.length > 0) {
            // Fetch features and validate they belong to selected products
            const featureIds = updateDto.featureConfigs.map(cfg => cfg.featureId);
            const features: Feature[] = [];
            const featureMap = new Map<string, Feature>();
            const productIdsSet = new Set(productIds);

            for (const featureId of featureIds) {
                const feature = await this.featureRepository.findById(featureId);
                if (!feature) {
                    throw new NotFoundException(`Feature with ID ${featureId} not found`);
                }
                
                // Validate feature belongs to one of the selected products
                if (!productIdsSet.has(feature.productId)) {
                    throw new Error(
                        `Feature ${featureId} (${feature.name}) does not belong to any of the selected products`
                    );
                }

                features.push(feature);
                featureMap.set(featureId, feature);
            }

            // Organize features by product
            for (const product of products) {
                const productFeaturesList = features.filter(f => f.productId === product.id);
                if (productFeaturesList.length > 0) {
                    productFeatures.set(product.id, productFeaturesList);
                }
            }

            // Convert feature configs to PlanFeatureConfigInput format
            featureConfigs = updateDto.featureConfigs.map(cfg => {
                const feature = featureMap.get(cfg.featureId);
                if (!feature) {
                    throw new Error(`Feature ${cfg.featureId} not found in fetched features`);
                }
                return {
                    featureId: cfg.featureId,
                    featureCode: feature.code,
                    isActive: cfg.isActive,
                    quotaLimit: cfg.quotaLimit,
                    pricingTiers: cfg.pricingTiers,
                };
            });
        } else {
            // No feature configs provided, fetch all features from products
            for (const product of products) {
                const features = await this.featureRepository.findByProductId(product.id!);
                if (features.length > 0) {
                    productFeatures.set(product.id!, features);
                }
            }
        }

        // Update plan with new product IDs if they were changed
        if (updateDto.productIds) {
            finalPlan = new Plan({
                ...updatedPlan.toProps(),
                productIds: products.map(p => p.id),
            });
        }

        // Step 10: Persist changes (infrastructure concern)
        let savedPlan: Plan;
        const hasProductOrFeatureChanges = updateDto.productIds || (updateDto.featureConfigs && updateDto.featureConfigs.length > 0);
        
        if (mustCreateVersion) {
            // Save archived original plan (if it's a new version)
            if (originalPlan.id !== updatedPlan.id) {
                await this.planRepository.update(originalPlan);
            }

            // Save new version with products and features
            const saved = await this.planPersistenceService.savePlanWithExistingEntities(
                finalPlan,
                products,
                productFeatures,
                featureConfigs,
            );
            savedPlan = saved.plan;
            products = saved.products;
            productFeatures = saved.productFeatures;
        } else {
            // Update existing plan directly (only for draft/active plans without subscriptions)
            if (hasProductOrFeatureChanges) {
                // If products or features are being updated, use persistence service
                const saved = await this.planPersistenceService.savePlanWithExistingEntities(
                    finalPlan,
                    products,
                    productFeatures,
                    featureConfigs,
                );
                savedPlan = saved.plan;
                products = saved.products;
                productFeatures = saved.productFeatures;
            } else {
                // No product/feature changes, just update the plan
                savedPlan = await this.planRepository.update(finalPlan);
            }
        }

        // Step 11: Map to response DTO
        return this.planResponseMapper.toResponseDto(
            savedPlan,
            products,
            productFeatures,
        );
    }

    /**
     * Converts UpdatePlanDto to partial PlanProps for updating
     */
    private async convertDtoToPlanProps(
        dto: UpdatePlanDto,
        existingPlan: Plan,
    ): Promise<Partial<PlanProps>> {
        const changes: Partial<PlanProps> = {};

        if (dto.name !== undefined) {
            changes.name = dto.name;
        }

        if (dto.planType !== undefined) {
            changes.planType = dto.planType;
        }

        if (dto.price !== undefined) {
            const recurringChargePeriod = new RecurringChargePeriod(
                dto.price.recurringChargePeriod.chargeFrequency,
                new Date(dto.price.recurringChargePeriod.startDateTime),
                dto.price.recurringChargePeriod.numberOfPeriods,
            );

            changes.price = new Price(
                dto.price.value,
                dto.price.currency,
                recurringChargePeriod,
                dto.price.isActive,
                dto.price.description,
            );
        }

        if (dto.renewalDefinition !== undefined) {
            const gracePeriod = new TimePeriod(
                dto.renewalDefinition.gracePeriod.name,
                dto.renewalDefinition.gracePeriod.value,
            );

            changes.renewalDefinition = new RenewalDefinition(
                dto.renewalDefinition.isExpirable,
                dto.renewalDefinition.isAutomaticRenewable,
                dto.renewalDefinition.renewCycleUnits,
                gracePeriod,
                dto.renewalDefinition.maxRenewCycles,
            );
        }

        if (dto.trialPeriod !== undefined) {
            changes.trialPeriod = new TimePeriod(
                dto.trialPeriod.name,
                dto.trialPeriod.value,
            );
        }

        if (dto.metadata !== undefined) {
            changes.metadata = dto.metadata;
        }

        if (dto.status !== undefined) {
            changes.status = dto.status;
        }

        return changes;
    }
}
