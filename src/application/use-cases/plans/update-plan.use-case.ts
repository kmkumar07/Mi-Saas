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
import { Plan } from '@domain/entities';
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

        // Step 2: Check if plan has active subscriptions
        const activeSubscriptions = await this.subscriptionRepository.findActiveByPlanId(planId);
        const hasActiveSubscriptions = activeSubscriptions.length > 0;

        let updatedPlan: Plan;
        let products: Product[] = [];
        let productFeatures: Map<string, Feature[]> = new Map();

        if (hasActiveSubscriptions) {
            // Step 3a: Plan has active subscriptions - archive old and create new version
            existingPlan.archive();
            await this.planRepository.update(existingPlan);

            // Create new version with changes
            const changes = await this.convertDtoToPlanProps(updateDto, existingPlan);
            updatedPlan = existingPlan.createNewVersion(changes);

            // If products are being updated, we need to handle them
            if (updateDto.products) {
                // Create or update products and features
                for (const productDto of updateDto.products) {
                    let product: Product;
                    
                    // Check if product already exists (by name or create new)
                    // For simplicity, we'll create new products for the new plan version
                    product = new Product({
                        tenantId: existingPlan.tenantId,
                        name: productDto.name,
                        description: productDto.description,
                    });
                    products.push(product);

                    // Create features for this product
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
                updatedPlan = new Plan({
                    ...updatedPlan.toProps(),
                    productIds: products.map(p => p.id),
                });
            } else {
                // Use existing products
                products = await Promise.all(
                    existingPlan.productIds.map(async (productId) => {
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

            // Persist the new version
            const saved = await this.planPersistenceService.savePlanAggregate(
                updatedPlan,
                products,
                productFeatures,
            );
            updatedPlan = saved.plan;
            products = saved.products;
            productFeatures = saved.productFeatures;
        } else {
            // Step 3b: No active subscriptions - update directly
            const changes = await this.convertDtoToPlanProps(updateDto, existingPlan);
            
            // Apply changes to existing plan
            if (changes.name !== undefined) {
                existingPlan.updateName(changes.name);
            }
            if (changes.planType !== undefined) {
                existingPlan.updatePlanType(changes.planType);
            }
            if (changes.price !== undefined) {
                existingPlan.updatePrice(changes.price);
            }
            if (changes.renewalDefinition !== undefined) {
                existingPlan.updateRenewalDefinition(changes.renewalDefinition);
            }
            if (changes.trialPeriod !== undefined) {
                existingPlan.updateTrialPeriod(changes.trialPeriod);
            }
            if (changes.metadata !== undefined) {
                existingPlan.updateMetadata(changes.metadata);
            }
            if (changes.productIds !== undefined) {
                // Handle product updates
                const currentProductIds = existingPlan.productIds;
                const newProductIds = changes.productIds;

                // Remove products that are no longer in the list
                for (const productId of currentProductIds) {
                    if (!newProductIds.includes(productId)) {
                        existingPlan.removeProduct(productId);
                    }
                }

                // Add new products
                for (const productId of newProductIds) {
                    if (!currentProductIds.includes(productId)) {
                        existingPlan.addProduct(productId);
                    }
                }
            }

            // If products are being updated via DTO
            if (updateDto.products) {
                // This is more complex - we'd need to create/update products
                // For now, we'll update the plan and let the persistence layer handle it
                // This is a simplified approach - in production you might want more sophisticated product management
            }

            updatedPlan = await this.planRepository.update(existingPlan);

            // Fetch products and features for response
            products = await Promise.all(
                updatedPlan.productIds.map(async (productId) => {
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

        // Step 4: Map to response DTO
        return this.planResponseMapper.toResponseDto(
            updatedPlan,
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
    ): Promise<Partial<Plan['toProps']>> {
        const changes: Partial<Plan['toProps']> = {};

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
