import { Inject, Injectable } from '@nestjs/common';
import {
    IPlanRepository,
    PLAN_REPOSITORY,
    IProductRepository,
    PRODUCT_REPOSITORY,
    IFeatureRepository,
    FEATURE_REPOSITORY,
    IPlanFeatureConfigRepository,
    PLAN_FEATURE_CONFIG_REPOSITORY,
} from '@domain/repositories';
import { Plan } from '@domain/entities';
import {
    PlanResponseDto,
    ProductResponseDto,
    FeatureResponseDto,
    PriceResponseDto,
    RecurringChargePeriodResponseDto,
    RenewalDefinitionResponseDto,
    TimePeriodResponseDto,
    PlanFeatureConfigResponseDto,
    FeaturePricingTierResponseDto,
} from '../../dtos/plan-response.dto';

@Injectable()
export class GetPlansByFamilyUseCase {
    constructor(
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(PLAN_FEATURE_CONFIG_REPOSITORY)
        private readonly planFeatureConfigRepository: IPlanFeatureConfigRepository,
    ) { }

    async execute(planFamilyId: string): Promise<PlanResponseDto[]> {
        const plans = await this.planRepository.findByPlanFamilyId(planFamilyId);

        // Filter to only published/active plans
        const activePlans = plans.filter(
            plan => plan.status === 'published' || plan.status === 'active'
        );

        // Get the latest version of each plan (they're already ordered by version desc)
        const latestPlans = activePlans.filter((plan, index, self) => {
            // Keep only the first occurrence of each plan code (which is the latest version)
            return index === self.findIndex(p => p.planCode === plan.planCode);
        });

        // Fetch all plan-feature-configs for all plans at once for efficiency
        const planIds = latestPlans.map(p => p.id!);
        const allPlanFeatureConfigs = await this.planFeatureConfigRepository.findByPlanIds(planIds);
        const configsByPlanIdAndFeatureId = new Map<string, Map<string, any>>();
        
        for (const config of allPlanFeatureConfigs) {
            if (!configsByPlanIdAndFeatureId.has(config.planId)) {
                configsByPlanIdAndFeatureId.set(config.planId, new Map());
            }
            configsByPlanIdAndFeatureId.get(config.planId)!.set(config.featureId, config);
        }

        return Promise.all(
            latestPlans.map(plan => this.toResponseDto(plan, configsByPlanIdAndFeatureId.get(plan.id!) || new Map()))
        );
    }

    private async toResponseDto(plan: Plan, configsByFeatureId: Map<string, any>): Promise<PlanResponseDto> {
        // Fetch products for this plan
        const products = await Promise.all(
            plan.productIds.map(async (productId: string) => {
                const product = await this.productRepository.findById(productId);
                if (!product) {
                    throw new Error(`Product ${productId} not found`);
                }

                // Fetch features for this product
                const features = await this.featureRepository.findByProductId(productId);

                return {
                    id: product.id!,
                    name: product.name,
                    description: product.description,
                    features: features.map(feature => {
                        const config = configsByFeatureId.get(feature.id!);
                        return {
                            id: feature.id!,
                            name: feature.name,
                            code: feature.code,
                            description: feature.description,
                            featureType: feature.featureType,
                            chargeModel: feature.chargeModel,
                            serviceUrl: feature.serviceUrl,
                            planFeatureConfig: config ? this.mapPlanFeatureConfig(config) : undefined,
                        } as FeatureResponseDto;
                    }),
                } as ProductResponseDto;
            })
        );

        // Map price with recurring charge period
        const priceResponse: PriceResponseDto = {
            priceId: plan.price.priceId,
            value: plan.price.value,
            currency: plan.price.currency,
            isActive: plan.price.isActive,
            description: plan.price.description,
            recurringChargePeriod: {
                recurringChargePeriodId: plan.price.recurringChargePeriod.recurringChargePeriodId,
                chargeFrequency: plan.price.recurringChargePeriod.chargeFrequency,
                startDateTime: plan.price.recurringChargePeriod.startDateTime,
                numberOfPeriods: plan.price.recurringChargePeriod.numberOfPeriods,
            } as RecurringChargePeriodResponseDto,
        };

        // Map renewal definition (if exists)
        let renewalDefinitionResponse: RenewalDefinitionResponseDto | undefined;
        if (plan.renewalDefinition) {
            renewalDefinitionResponse = {
                isExpirable: plan.renewalDefinition.isExpirable,
                isAutomaticRenewable: plan.renewalDefinition.isAutomaticRenewable,
                renewCycleUnits: plan.renewalDefinition.renewCycleUnits,
                gracePeriod: {
                    timePeriodId: plan.renewalDefinition.gracePeriod.timePeriodId,
                    name: plan.renewalDefinition.gracePeriod.name,
                    value: plan.renewalDefinition.gracePeriod.value,
                } as TimePeriodResponseDto,
                maxRenewCycles: plan.renewalDefinition.maxRenewCycles,
            };
        }

        // Map trial period (if exists)
        let trialPeriodResponse: TimePeriodResponseDto | undefined;
        if (plan.trialPeriod) {
            trialPeriodResponse = {
                timePeriodId: plan.trialPeriod.timePeriodId,
                name: plan.trialPeriod.name,
                value: plan.trialPeriod.value,
            };
        }

        return {
            id: plan.id!,
            planFamilyId: plan.planFamilyId,
            name: plan.name,
            planCode: plan.planCode,
            planType: plan.planType,
            version: plan.version,
            products,
            price: priceResponse,
            renewalDefinition: renewalDefinitionResponse,
            trialPeriod: trialPeriodResponse,
            active: plan.active,
            status: plan.status,
            metadata: plan.metadata,
            createdAt: plan.createdAt,
        };
    }

    private mapPlanFeatureConfig(config: any): PlanFeatureConfigResponseDto {
        return {
            isActive: config.isActive,
            quotaLimit: config.quotaLimit,
            pricingTiers: config.pricingTiers?.map((tier: any) => ({
                id: tier.id,
                fromQuantity: tier.fromQuantity,
                toQuantity: tier.toQuantity,
                pricePerUnit: tier.pricePerUnit,
                currency: tier.currency,
            } as FeaturePricingTierResponseDto)),
        };
    }
}

