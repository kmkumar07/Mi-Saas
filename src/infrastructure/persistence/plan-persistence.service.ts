import { Inject, Injectable } from '@nestjs/common';
import { Plan, Product, Feature } from '@domain/entities';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { ProductMapper } from '../mappers/product.mapper';
import { FeatureMapper } from '../mappers/feature.mapper';
import { PlanMapper } from '../mappers/plan.mapper';
import {
    products as productsTable,
    features as featuresTable,
    plans as plansTable,
    planProducts as planProductsTable,
    prices as pricesTable,
    recurringChargePeriods as recurringChargePeriodsTable,
    renewalDefinitions as renewalDefinitionsTable,
    trialPeriods as trialPeriodsTable,
} from '../database/schema';
import { Price } from '@domain/value-objects/price.vo';
import { RenewalDefinition } from '@domain/value-objects/renewal-definition.vo';
import { TimePeriod } from '@domain/value-objects/time-period.vo';

export interface PlanAggregatePersistenceResult {
    plan: Plan;
    products: Product[];
    productFeatures: Map<string, Feature[]>;
}

/**
 * Infrastructure service for persisting Plan aggregates
 * Handles transactions, database operations, and mapping
 */
@Injectable()
export class PlanPersistenceService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
        private readonly productMapper: ProductMapper,
        private readonly featureMapper: FeatureMapper,
        private readonly planMapper: PlanMapper,
    ) { }

    /**
     * Persists complete plan aggregate in a single transaction
     * All operations succeed together or fail together (atomicity)
     */
    async savePlanAggregate(
        plan: Plan,
        products: Product[],
        productFeatures: Map<string, Feature[]>,
    ): Promise<PlanAggregatePersistenceResult> {
        return await this.db.transaction(async (tx) => {
            // 1. Save products and features
            const { savedProducts, savedProductFeatures } =
                await this.saveProductsWithFeatures(tx, products, productFeatures);

            // 2. Save plan with all related tables
            const savedPlan = await this.savePlan(
                tx,
                plan,
                savedProducts.map(p => p.id),
            );

            return {
                plan: savedPlan,
                products: savedProducts,
                productFeatures: savedProductFeatures,
            };
        });
    }

    /**
     * Saves products and their features
     */
    private async saveProductsWithFeatures(
        tx: any,
        products: Product[],
        productFeatures: Map<string, Feature[]>,
    ): Promise<{
        savedProducts: Product[];
        savedProductFeatures: Map<string, Feature[]>;
    }> {
        const savedProducts: Product[] = [];
        const savedProductFeatures: Map<string, Feature[]> = new Map();

        for (const product of products) {
            // Save product
            const productRow = await tx
                .insert(productsTable)
                .values(this.productMapper.toPersistence(product))
                .returning();

            const savedProduct = this.productMapper.toDomain(productRow[0]);
            savedProducts.push(savedProduct);

            // Save features for this product
            const features = productFeatures.get(product.id) || [];
            const savedFeatures = await this.saveFeatures(tx, features, savedProduct.id);
            savedProductFeatures.set(savedProduct.id, savedFeatures);
        }

        return { savedProducts, savedProductFeatures };
    }

    /**
     * Saves features for a product
     */
    private async saveFeatures(
        tx: any,
        features: Feature[],
        productId: string,
    ): Promise<Feature[]> {
        const savedFeatures: Feature[] = [];

        for (const feature of features) {
            // Update feature with actual product ID
            const featureData = this.featureMapper.toPersistence(feature);
            featureData.productId = productId;

            const featureRow = await tx
                .insert(featuresTable)
                .values(featureData)
                .returning();

            savedFeatures.push(this.featureMapper.toDomain(featureRow[0]));
        }

        return savedFeatures;
    }

    /**
     * Saves plan with all related tables
     */
    private async savePlan(
        tx: any,
        plan: Plan,
        productIds: string[],
    ): Promise<Plan> {
        // Save price-related tables
        const priceId = await this.savePriceWithRecurringCharge(tx, plan.price);

        // Save renewal definition (if exists)
        const renewalDefinitionId = plan.renewalDefinition
            ? await this.saveRenewalDefinition(tx, plan.renewalDefinition)
            : undefined;

        // Save trial period (if exists)
        const trialPeriodId = plan.trialPeriod
            ? await this.saveTimePeriod(tx, plan.trialPeriod)
            : undefined;

        // Save plan
        const planData = this.planMapper.toPersistence(plan);
        const planRow = await tx
            .insert(plansTable)
            .values({
                ...planData,
                priceId,
                renewalDefinitionId,
                trialPeriodId,
            })
            .returning();

        // Save plan-product relationships
        await this.savePlanProductRelationships(tx, planRow[0].id, productIds);

        // Map back to domain
        return this.planMapper.toDomain(
            planRow[0],
            plan.price,
            plan.renewalDefinition,
            plan.trialPeriod,
        );
    }

    /**
     * Saves price with recurring charge period
     */
    private async savePriceWithRecurringCharge(
        tx: any,
        price: Price,
    ): Promise<string> {
        // Save recurring charge period
        const recurringChargePeriodRow = await tx
            .insert(recurringChargePeriodsTable)
            .values({
                chargeFrequency: price.recurringChargePeriod.chargeFrequency,
                startDateTime: price.recurringChargePeriod.startDateTime,
                numberOfPeriods: price.recurringChargePeriod.numberOfPeriods,
            })
            .returning();

        // Save price
        const priceRow = await tx
            .insert(pricesTable)
            .values({
                value: price.value,
                currency: price.currency,
                recurringChargePeriodId: recurringChargePeriodRow[0].id,
                isActive: price.isActive,
                description: price.description,
            })
            .returning();

        return priceRow[0].id;
    }

    /**
     * Saves renewal definition with grace period
     */
    private async saveRenewalDefinition(
        tx: any,
        renewalDefinition: RenewalDefinition,
    ): Promise<string> {
        // Save grace period
        const gracePeriodId = await this.saveTimePeriod(
            tx,
            renewalDefinition.gracePeriod,
        );

        // Save renewal definition
        const renewalRow = await tx
            .insert(renewalDefinitionsTable)
            .values({
                isExpirable: renewalDefinition.isExpirable,
                isAutomaticRenewable: renewalDefinition.isAutomaticRenewable,
                renewCycleUnits: renewalDefinition.renewCycleUnits,
                gracePeriodId,
                maxRenewCycles: renewalDefinition.maxRenewCycles,
            })
            .returning();

        return renewalRow[0].id;
    }

    /**
     * Saves time period
     */
    private async saveTimePeriod(tx: any, timePeriod: TimePeriod): Promise<string> {
        const timePeriodRow = await tx
            .insert(trialPeriodsTable)
            .values({
                name: timePeriod.name,
                value: timePeriod.value,
            })
            .returning();

        return timePeriodRow[0].id;
    }

    /**
     * Saves plan-product relationships
     */
    private async savePlanProductRelationships(
        tx: any,
        planId: string,
        productIds: string[],
    ): Promise<void> {
        for (const productId of productIds) {
            await tx.insert(planProductsTable).values({
                planId,
                productId,
            });
        }
    }
}
