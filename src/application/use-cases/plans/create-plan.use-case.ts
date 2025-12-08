import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePlanDto } from '../../dtos/create-plan.dto';
import { PlanResponseDto } from '../../dtos/plan-response.dto';
import { PlanResponseMapper } from '@application/mappers/plan-response.mapper';
import { PlanPersistenceService, PlanFeatureConfigInput } from '@infrastructure/persistence/plan-persistence.service';
import { Product, Feature, Plan } from '@domain/entities';
import { Price } from '@domain/value-objects/price.vo';
import { RecurringChargePeriod } from '@domain/value-objects/recurring-charge-period.vo';
import { RenewalDefinition } from '@domain/value-objects/renewal-definition.vo';
import { TimePeriod } from '@domain/value-objects/time-period.vo';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/repositories';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';

/**
 * Use case for creating a new plan
 * Fetches existing products and features, then configures them for the plan
 */
@Injectable()
export class CreatePlanUseCase {
    constructor(
        private readonly planPersistenceService: PlanPersistenceService,
        private readonly planResponseMapper: PlanResponseMapper,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
    ) { }

    async execute(dto: CreatePlanDto): Promise<PlanResponseDto> {
        // Step 0: Validate plan family exists and belongs to tenant
        const planFamily = await this.planFamilyRepository.findById(dto.planFamilyId);
        if (!planFamily) {
            throw new NotFoundException(`Plan family with ID ${dto.planFamilyId} not found`);
        }
        if (planFamily.tenantId !== dto.tenantId) {
            throw new BadRequestException(
                `Plan family ${dto.planFamilyId} does not belong to tenant ${dto.tenantId}`,
            );
        }

        // Step 1: Fetch existing products
        const products: Product[] = [];
        for (const productId of dto.productIds) {
            const product = await this.productRepository.findById(productId);
            if (!product) {
                throw new NotFoundException(`Product with ID ${productId} not found`);
            }
            if (product.tenantId !== dto.tenantId) {
                throw new BadRequestException(`Product ${productId} does not belong to tenant ${dto.tenantId}`);
            }
            products.push(product);
        }

        // Step 2: Fetch existing features and validate they belong to selected products
        const featureIds = dto.featureConfigs.map(cfg => cfg.featureId);
        const features: Feature[] = [];
        const featureMap = new Map<string, Feature>();
        const productIdsSet = new Set(dto.productIds);

        for (const featureId of featureIds) {
            const feature = await this.featureRepository.findById(featureId);
            if (!feature) {
                throw new NotFoundException(`Feature with ID ${featureId} not found`);
            }
            
            // Validate feature belongs to one of the selected products
            if (!productIdsSet.has(feature.productId)) {
                throw new BadRequestException(
                    `Feature ${featureId} (${feature.name}) does not belong to any of the selected products`
                );
            }

            features.push(feature);
            featureMap.set(featureId, feature);
        }

        // Step 3: Organize features by product
        const productFeatures: Map<string, Feature[]> = new Map();
        for (const product of products) {
            const productFeaturesList = features.filter(f => f.productId === product.id);
            if (productFeaturesList.length > 0) {
                productFeatures.set(product.id, productFeaturesList);
            }
        }

        // Step 4: Convert feature configs to PlanFeatureConfigInput format
        const featureConfigs: PlanFeatureConfigInput[] = dto.featureConfigs.map(cfg => {
            const feature = featureMap.get(cfg.featureId);
            if (!feature) {
                throw new BadRequestException(`Feature ${cfg.featureId} not found in fetched features`);
            }
            return {
                featureId: cfg.featureId,
                featureCode: feature.code,
                isActive: cfg.isActive,
                quotaLimit: cfg.quotaLimit,
                pricingTiers: cfg.pricingTiers,
            };
        });

        // Step 5: Create plan entity with value objects
        const plan = this.createPlan(dto, products, planFamily.planCode);

        // Step 6: Persist plan with existing products and features (infrastructure layer)
        const {
            plan: savedPlan,
            products: savedProducts,
            productFeatures: savedFeatures,
        } = await this.planPersistenceService.savePlanWithExistingEntities(
            plan,
            products,
            productFeatures,
            featureConfigs,
        );

        // Step 7: Map to response DTO
        return this.planResponseMapper.toResponseDto(
            savedPlan,
            savedProducts,
            savedFeatures,
        );
    }

    /**
     * Creates plan entity with all value objects
     */
    private createPlan(dto: CreatePlanDto, products: Product[], planCode: string): Plan {
        // Create recurring charge period
        const recurringChargePeriod = new RecurringChargePeriod(
            dto.price.recurringChargePeriod.chargeFrequency,
            new Date(dto.price.recurringChargePeriod.startDateTime),
            dto.price.recurringChargePeriod.numberOfPeriods,
        );

        // Create price
        const price = new Price(
            dto.price.value,
            dto.price.currency,
            recurringChargePeriod,
            dto.price.isActive,
            dto.price.description,
        );

        // Create renewal definition (if provided)
        let renewalDefinition: RenewalDefinition | undefined;
        if (dto.renewalDefinition) {
            const gracePeriod = new TimePeriod(
                dto.renewalDefinition.gracePeriod.name,
                dto.renewalDefinition.gracePeriod.value,
            );

            renewalDefinition = new RenewalDefinition(
                dto.renewalDefinition.isExpirable,
                dto.renewalDefinition.isAutomaticRenewable,
                dto.renewalDefinition.renewCycleUnits,
                gracePeriod,
                dto.renewalDefinition.maxRenewCycles,
            );
        }

        // Create trial period (if provided)
        let trialPeriod: TimePeriod | undefined;
        if (dto.trialPeriod) {
            trialPeriod = new TimePeriod(
                dto.trialPeriod.name,
                dto.trialPeriod.value,
            );
        }

        // Create plan entity with planFamilyId
        return new Plan({
            tenantId: dto.tenantId,
            planFamilyId: dto.planFamilyId,
            name: dto.name,
            planCode: planCode,
            planType: dto.planType,
            productIds: products.map(p => p.id),
            price,
            renewalDefinition,
            trialPeriod,
            metadata: dto.metadata,
            version: 1, // Initial version
        });
    }
}
