import { PricingModel, PerUserPricing, PerUsagePricing, TieredPricing, TieredPricingTier, VolumePricing, VolumePricingVolume, GraduatedPricing, GraduatedPricingTier } from '../value-objects';
import { ChargeModel } from '../enums';

export type PricingModelWithDetails = 
    | { type: ChargeModel.PER_USER; model: PerUserPricing }
    | { type: ChargeModel.PER_USAGE; model: PerUsagePricing }
    | { type: ChargeModel.TIERED; model: TieredPricing }
    | { type: ChargeModel.VOLUME; model: VolumePricing }
    | { type: ChargeModel.GRADUATED; model: GraduatedPricing };

export interface IPricingModelRepository {
    /**
     * Finds pricing models for the given plan feature IDs.
     */
    findByPlanFeatureIds(planFeatureIds: string[]): Promise<Map<string, PricingModelWithDetails>>;

    /**
     * Saves a pricing model for a plan feature.
     */
    save(pricingModel: PricingModel, details: PricingModelWithDetails): Promise<void>;

    /**
     * Deletes pricing models for the given plan feature IDs.
     */
    deleteByPlanFeatureIds(planFeatureIds: string[]): Promise<void>;
}

export const PRICING_MODEL_REPOSITORY = Symbol('PRICING_MODEL_REPOSITORY');

