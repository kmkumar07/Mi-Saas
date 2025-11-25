import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    IPlanRepository,
    PLAN_REPOSITORY,
    IProductRepository,
    PRODUCT_REPOSITORY,
    IFeatureRepository,
    FEATURE_REPOSITORY,
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
} from '../../dtos/plan-response.dto';

@Injectable()
export class GetPlanUseCase {
    constructor(
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
    ) { }

    async execute(id: string): Promise<PlanResponseDto> {
        const plan = await this.planRepository.findById(id);

        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found`);
        }

        return this.toResponseDto(plan);
    }

    private async toResponseDto(plan: Plan): Promise<PlanResponseDto> {
        // Fetch products for this plan
        const products = await Promise.all(
            plan.productIds.map(async (productId) => {
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
                    features: features.map(feature => ({
                        id: feature.id!,
                        name: feature.name,
                        code: feature.code,
                        description: feature.description,
                        featureType: feature.featureType,
                        chargeModel: feature.chargeModel,
                        serviceUrl: feature.serviceUrl,
                    } as FeatureResponseDto)),
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
            tenantId: plan.tenantId,
            name: plan.name,
            planCode: plan.planCode,
            planType: plan.planType,
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
}
