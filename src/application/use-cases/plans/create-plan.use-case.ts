import { Injectable } from '@nestjs/common';
import { CreatePlanDto } from '../../dtos/create-plan.dto';
import { PlanResponseDto } from '../../dtos/plan-response.dto';
import { PlanResponseMapper } from '@application/mappers/plan-response.mapper';
import { PlanPersistenceService, PlanFeatureConfigInput } from '@infrastructure/persistence/plan-persistence.service';
import { Product, Feature, Plan, PlanFamily } from '@domain/entities';
import { Price } from '@domain/value-objects/price.vo';
import { RecurringChargePeriod } from '@domain/value-objects/recurring-charge-period.vo';
import { RenewalDefinition } from '@domain/value-objects/renewal-definition.vo';
import { TimePeriod } from '@domain/value-objects/time-period.vo';

/**
 * Use case for creating a new plan
 * Creates domain entities with validation and delegates persistence to infrastructure
 */
@Injectable()
export class CreatePlanUseCase {
    constructor(
        private readonly planPersistenceService: PlanPersistenceService,
        private readonly planResponseMapper: PlanResponseMapper,
    ) { }

    async execute(dto: CreatePlanDto): Promise<PlanResponseDto> {
        // Step 1: Create products with features (domain entities)
        const products: Product[] = [];
        const productFeatures: Map<string, Feature[]> = new Map();
        const featureConfigs: PlanFeatureConfigInput[] = [];

        for (const productDto of dto.products) {
            // Create product entity
            const product = new Product({
                tenantId: dto.tenantId,
                name: productDto.name,
                description: productDto.description,
            });
            products.push(product);

            // Create feature entities for this product
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

                featureConfigs.push({
                    featureCode: featureDto.code,
                    isActive: featureDto.isActive,
                    quotaLimit: featureDto.quotaLimit,
                    pricingTiers: featureDto.pricingTiers,
                });
            }
            productFeatures.set(product.id, features);
        }

        // Step 2: Create plan entity with value objects
        const plan = this.createPlan(dto, products);

        // Step 3: Persist everything in a single transaction (infrastructure layer)
        const {
            plan: savedPlan,
            products: savedProducts,
            productFeatures: savedFeatures,
        } = await this.planPersistenceService.savePlanAggregate(
            plan,
            products,
            productFeatures,
            featureConfigs,
        );

        // Step 4: Map to response DTO
        return this.planResponseMapper.toResponseDto(
            savedPlan,
            savedProducts,
            savedFeatures,
        );
    }

    /**
     * Creates plan entity with all value objects
     */
    private createPlan(dto: CreatePlanDto, products: Product[]): Plan {
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

        // Create plan family with initial version-1 plan
        const family = PlanFamily.createInitialPlan({
            tenantId: dto.tenantId,
            name: dto.name,
            planType: dto.planType,
            productIds: products.map(p => p.id),
            price,
            renewalDefinition,
            trialPeriod,
            metadata: dto.metadata,
        });

        return family.latestPlan;
    }
}
