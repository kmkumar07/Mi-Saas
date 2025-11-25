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
import { PlanPersistenceService } from '@infrastructure/persistence/plan-persistence.service';
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

        // Step 2: Check if plan has active subscriptions (infrastructure concern - querying)
        const activeSubscriptions = await this.subscriptionRepository.findActiveByPlanId(planId);
        const hasActiveSubscriptions = activeSubscriptions.length > 0;

        // Step 3: Construct aggregate root for plan family
        const planFamily = PlanFamily.fromPlans([existingPlan]);

        // Step 4: Convert DTO to domain changes
        const changes = await this.convertDtoToPlanProps(updateDto, existingPlan);

        // Step 5: Apply updates using aggregate root (business logic)
        const { originalPlan, updatedPlan } = planFamily.updateLatestPlan(
            changes,
            hasActiveSubscriptions,
        );

        // Step 6: Handle products and features (application orchestration)
        let products: Product[] = [];
        let productFeatures: Map<string, Feature[]> = new Map();
        let finalPlan: Plan = updatedPlan;

        if (updateDto.products) {
            // Create new products and features for the updated plan
            for (const productDto of updateDto.products) {
                const product = new Product({
                    tenantId: existingPlan.tenantId,
                    name: productDto.name,
                    description: productDto.description,
                });
                products.push(product);

                const features: Feature[] = [];
                for (const featureDto of productDto.features) {
                    const feature = new Feature({
                        productId: product.id,
                        name: featureDto.name,
                        code: featureDto.code,
                        description: featureDto.description,
                        featureType: featureDto.featureType,
                        chargeModel: featureDto.chargeModel,
                        serviceUrl: featureDto.serviceUrl,
                    });
                    features.push(feature);
                }
                productFeatures.set(product.id, features);
            }

            // Create a new plan instance with the updated product IDs
            finalPlan = new Plan({
                ...updatedPlan.toProps(),
                productIds: products.map(p => p.id),
            });
        } else {
            // Use existing products
            const productIds = hasActiveSubscriptions
                ? updatedPlan.productIds
                : originalPlan.productIds;

            products = await Promise.all(
                productIds.map(async (productId) => {
                    const product = await this.productRepository.findById(productId);
                    if (!product) {
                        throw new Error(`Product ${productId} not found`);
                    }
                    return product;
                })
            );

            for (const product of products) {
                const features = await this.featureRepository.findByProductId(product.id!);
                productFeatures.set(product.id!, features);
            }
        }

        // Step 7: Persist changes (infrastructure concern)
        let savedPlan: Plan;
        if (hasActiveSubscriptions) {
            // Save archived original plan
            await this.planRepository.update(originalPlan);

            // Save new version with products and features
            const saved = await this.planPersistenceService.savePlanAggregate(
                finalPlan,
                products,
                productFeatures,
            );
            savedPlan = saved.plan;
            products = saved.products;
            productFeatures = saved.productFeatures;
        } else {
            // Update existing plan directly
            if (updateDto.products) {
                // If products are being updated, use persistence service to save everything
                const saved = await this.planPersistenceService.savePlanAggregate(
                    finalPlan,
                    products,
                    productFeatures,
                );
                savedPlan = saved.plan;
                products = saved.products;
                productFeatures = saved.productFeatures;
            } else {
                // No product changes, just update the plan
                savedPlan = await this.planRepository.update(finalPlan);
            }
        }

        // Step 8: Map to response DTO
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

        return changes;
    }
}
