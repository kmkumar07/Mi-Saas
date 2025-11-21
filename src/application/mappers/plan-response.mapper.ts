import { Injectable } from '@nestjs/common';
import { Plan, Product, Feature } from '@domain/entities';
import { PlanResponseDto } from '@application/dtos/plan-response.dto';

/**
 * Application layer mapper for converting domain entities to response DTOs
 */
@Injectable()
export class PlanResponseMapper {
    /**
     * Maps Plan domain aggregate to response DTO
     */
    toResponseDto(
        plan: Plan,
        products: Product[],
        productFeatures: Map<string, Feature[]>,
    ): PlanResponseDto {
        return {
            id: plan.id,
            tenantId: plan.tenantId,
            name: plan.name,
            planType: plan.planType,
            products: this.mapProducts(products, productFeatures),
            price: this.mapPrice(plan),
            renewalDefinition: this.mapRenewalDefinition(plan),
            trialPeriod: this.mapTrialPeriod(plan),
            active: plan.active,
            metadata: plan.metadata,
            createdAt: plan.createdAt,
        };
    }

    /**
     * Maps products with their features to response DTOs
     */
    private mapProducts(
        products: Product[],
        productFeatures: Map<string, Feature[]>,
    ) {
        return products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            features: this.mapFeatures(productFeatures.get(product.id) || []),
        }));
    }

    /**
     * Maps features to response DTOs
     */
    private mapFeatures(features: Feature[]) {
        return features.map(feature => ({
            id: feature.id,
            name: feature.name,
            code: feature.code,
            description: feature.description,
            featureType: feature.featureType,
            chargeModel: feature.chargeModel,
            serviceUrl: feature.serviceUrl,
        }));
    }

    /**
     * Maps price to response DTO
     */
    private mapPrice(plan: Plan) {
        const recurringChargePeriod = {
            recurringChargePeriodId: plan.price.recurringChargePeriod.recurringChargePeriodId,
            chargeFrequency: plan.price.recurringChargePeriod.chargeFrequency,
            startDateTime: plan.price.recurringChargePeriod.startDateTime,
            numberOfPeriods: plan.price.recurringChargePeriod.numberOfPeriods,
        };

        return {
            priceId: plan.price.priceId,
            value: plan.price.value,
            currency: plan.price.currency,
            recurringChargePeriod,
            isActive: plan.price.isActive,
            description: plan.price.description,
        };
    }

    /**
     * Maps renewal definition to response DTO
     */
    private mapRenewalDefinition(plan: Plan) {
        if (!plan.renewalDefinition) {
            return undefined;
        }

        const gracePeriod = {
            timePeriodId: plan.renewalDefinition.gracePeriod.timePeriodId,
            name: plan.renewalDefinition.gracePeriod.name,
            value: plan.renewalDefinition.gracePeriod.value,
        };

        return {
            isExpirable: plan.renewalDefinition.isExpirable,
            isAutomaticRenewable: plan.renewalDefinition.isAutomaticRenewable,
            renewCycleUnits: plan.renewalDefinition.renewCycleUnits,
            gracePeriod,
            maxRenewCycles: plan.renewalDefinition.maxRenewCycles,
        };
    }

    /**
     * Maps trial period to response DTO
     */
    private mapTrialPeriod(plan: Plan) {
        if (!plan.trialPeriod) {
            return undefined;
        }

        return {
            timePeriodId: plan.trialPeriod.timePeriodId,
            name: plan.trialPeriod.name,
            value: plan.trialPeriod.value,
        };
    }
}
