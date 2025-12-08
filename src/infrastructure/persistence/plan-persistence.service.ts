import { Inject, Injectable } from '@nestjs/common';
import { Plan, Product, Feature, PlanFeatureConfig, PlanFamily } from '@domain/entities';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../database/schema';
import { ProductMapper } from '../mappers/product.mapper';
import { FeatureMapper } from '../mappers/feature.mapper';
import { PlanMapper } from '../mappers/plan.mapper';
import { IPlanFamilyRepository, PLAN_FAMILY_REPOSITORY } from '@domain/repositories';
import {
    products as productsTable,
    features as featuresTable,
    plans as plansTable,
    planProducts as planProductsTable,
    planProductVersions as planProductVersionsTable,
    productVersions as productVersionsTable,
    prices as pricesTable,
    recurringChargePeriods as recurringChargePeriodsTable,
    renewalDefinitions as renewalDefinitionsTable,
    trialPeriods as trialPeriodsTable,
    planFeatures as planFeaturesTable,
    featurePricingTiers as featurePricingTiersTable,
} from '../database/schema';
import { IProductVersionRepository, PRODUCT_VERSION_REPOSITORY } from '@domain/repositories/product-version.repository.interface';
import { ProductVersion } from '@domain/entities/product-version.entity';
import { Price } from '@domain/value-objects/price.vo';
import { RenewalDefinition } from '@domain/value-objects/renewal-definition.vo';
import { TimePeriod } from '@domain/value-objects/time-period.vo';
import { FeaturePricingTier } from '@domain/value-objects';
import { randomUUID } from 'crypto';

export interface PlanAggregatePersistenceResult {
    plan: Plan;
    products: Product[];
    productFeatures: Map<string, Feature[]>;
}

export interface PlanFeatureConfigInput {
    featureId?: string; // Use featureId when working with existing features
    featureCode?: string; // Use featureCode for backward compatibility
    isActive?: boolean;
    quotaLimit?: number;
    pricingTiers?: {
        fromQuantity: number;
        toQuantity?: number;
        pricePerUnit: number;
        currency?: string;
    }[];
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
        @Inject(PLAN_FAMILY_REPOSITORY)
        private readonly planFamilyRepository: IPlanFamilyRepository,
        @Inject(PRODUCT_VERSION_REPOSITORY)
        private readonly productVersionRepository: IProductVersionRepository,
    ) { }

    /**
     * Persists complete plan aggregate in a single transaction
     * All operations succeed together or fail together (atomicity)
     * @deprecated Use savePlanWithExistingEntities when working with existing products/features
     */
    async savePlanAggregate(
        plan: Plan,
        products: Product[],
        productFeatures: Map<string, Feature[]>,
        featureConfigs: PlanFeatureConfigInput[] = [],
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

            // 3. Save per-plan feature configuration (availability, quotas, pricing tiers)
            await this.savePlanFeatureConfigurations(
                tx,
                savedPlan,
                savedProductFeatures,
                featureConfigs,
            );

            return {
                plan: savedPlan,
                products: savedProducts,
                productFeatures: savedProductFeatures,
            };
        });
    }

    /**
     * Persists plan with existing products and features (does not create new products/features)
     * Links existing entities to the plan and configures features
     * Uses provided planFamilyId and ensures planCode is synced from family
     */
    async savePlanWithExistingEntities(
        plan: Plan,
        products: Product[],
        productFeatures: Map<string, Feature[]>,
        featureConfigs: PlanFeatureConfigInput[] = [],
    ): Promise<PlanAggregatePersistenceResult> {
        return await this.db.transaction(async (tx) => {
            // 0. Load plan family by ID and sync planCode
            if (!plan.planFamilyId) {
                throw new Error('PlanFamilyId is required');
            }

            const planFamily = await this.planFamilyRepository.findById(plan.planFamilyId);
            if (!planFamily) {
                throw new Error(`PlanFamily with ID ${plan.planFamilyId} not found`);
            }

            // Sync planCode from family to plan
            plan.setPlanFamily(planFamily.id, planFamily.planCode);

            // 1. Save plan with all related tables (products already exist, just link them)
            const savedPlan = await this.savePlan(
                tx,
                plan,
                products.map(p => p.id!),
            );

            // 2. If plan is published, create product versions for immutability
            // This must happen after plan is saved so we have the planId
            if (savedPlan.isPublished) {
                await this.createProductVersionsForPlan(tx, savedPlan, products);
                // Re-link to product versions instead of products
                // Delete existing plan_products links and create plan_product_versions links
                await tx.delete(planProductsTable).where(eq(planProductsTable.planId, savedPlan.id));
                await this.savePlanProductVersions(tx, savedPlan.id, products);
            }

            // 3. Save per-plan feature configuration (availability, quotas, pricing tiers)
            await this.savePlanFeatureConfigurations(
                tx,
                savedPlan,
                productFeatures,
                featureConfigs,
            );

            return {
                plan: savedPlan,
                products: products,
                productFeatures: productFeatures,
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
        // Save plan first to get planId (required for prices table, renewal definitions, and trial periods)
        const planData = this.planMapper.toPersistence(plan);
        const planRow = await tx
            .insert(plansTable)
            .values({
                ...planData,
            })
            .returning();

        // Save trial period (if exists) - needs planId
        if (plan.trialPeriod) {
            await this.saveTimePeriod(tx, plan.trialPeriod, planRow[0].id);
        }

        // Save renewal definition (if exists) - needs planId
        // Note: renewal_definitions table has planId, not the other way around
        if (plan.renewalDefinition) {
            await this.saveRenewalDefinition(tx, plan.renewalDefinition, planRow[0].id);
        }

        // Save price-related tables (now that we have planId)
        const priceId = await this.savePriceWithRecurringCharge(tx, plan.price, planRow[0].id);

        // Update plan with priceId if needed (if plans table has priceId column)
        // Note: Based on schema, plans table doesn't seem to have priceId, so this might not be needed
        // But keeping it for compatibility with plan mapper

        // Save plan-product relationships (for draft/active plans)
        // Published plans will have product versions linked separately
        if (plan.status !== 'published') {
            await this.savePlanProductRelationships(tx, planRow[0].id, productIds);
        }

        // Map back to domain (pass productIds to satisfy validation)
        return this.planMapper.toDomain(
            planRow[0],
            plan.price,
            plan.renewalDefinition,
            plan.trialPeriod,
            productIds, // Pass productIds to satisfy Plan entity validation
        );
    }

    /**
     * Saves price with recurring charge period
     * Requires planId to be provided (plan must be saved first)
     */
    private async savePriceWithRecurringCharge(
        tx: any,
        price: Price,
        planId: string,
    ): Promise<string> {
        // Generate priceId (varchar field required by prices table)
        const priceIdString = `price_${randomUUID().replace(/-/g, '')}`;

        // Save price first (recurringChargePeriod needs priceId from prices table)
        const priceRow = await tx
            .insert(pricesTable)
            .values({
                planId: planId, // Required: prices table has planId as not null
                priceId: priceIdString, // Required: prices table has priceId as not null varchar
                value: price.value,
                currency: price.currency,
                isActive: price.isActive,
                description: price.description,
            })
            .returning();

        // Save recurring charge period with priceId (references prices.id)
        await tx
            .insert(recurringChargePeriodsTable)
            .values({
                priceId: priceRow[0].id, // UUID reference to prices.id
                chargeFrequency: price.recurringChargePeriod.chargeFrequency,
                startDateTime: price.recurringChargePeriod.startDateTime,
                numberOfPeriods: price.recurringChargePeriod.numberOfPeriods,
            });

        return priceRow[0].id;
    }

    /**
     * Saves renewal definition with grace period
     * Requires planId to be provided (plan must be saved first)
     */
    private async saveRenewalDefinition(
        tx: any,
        renewalDefinition: RenewalDefinition,
        planId: string,
    ): Promise<string> {
        // Save renewal definition with grace period name and value directly
        // (schema stores gracePeriodName and gracePeriodValue, not a separate time period)
        const renewalRow = await tx
            .insert(renewalDefinitionsTable)
            .values({
                planId: planId, // Required: renewal_definitions table has planId as not null
                isExpirable: renewalDefinition.isExpirable,
                isAutomaticRenewable: renewalDefinition.isAutomaticRenewable,
                renewCycleUnits: renewalDefinition.renewCycleUnits,
                gracePeriodName: renewalDefinition.gracePeriod.name, // Required: not null
                gracePeriodValue: renewalDefinition.gracePeriod.value, // Required: not null
                maxRenewCycles: renewalDefinition.maxRenewCycles,
            })
            .returning();

        return renewalRow[0].id;
    }

    /**
     * Saves time period (trial period)
     * Requires planId to be provided (plan must be saved first)
     */
    private async saveTimePeriod(tx: any, timePeriod: TimePeriod, planId: string): Promise<string> {
        const timePeriodRow = await tx
            .insert(trialPeriodsTable)
            .values({
                planId: planId, // Required: trial_periods table has planId as not null
                name: timePeriod.name,
                value: timePeriod.value,
            })
            .returning();

        return timePeriodRow[0].id;
    }

    /**
     * Saves plan-product relationships
     * For draft/active plans, links directly to products
     */
    private async savePlanProductRelationships(
        tx: any,
        planId: string,
        productIds: string[],
    ): Promise<void> {
        // For draft/active plans, use regular plan_products
        for (const productId of productIds) {
            await tx.insert(planProductsTable).values({
                planId,
                productId,
            });
        }
    }
    
    /**
     * Saves plan-product version relationships
     * For published plans, links to product versions instead of products directly
     */
    private async savePlanProductVersions(
        tx: any,
        planId: string,
        products: Product[],
    ): Promise<void> {
        // For published plans, link to product versions
        // Product versions should already be created by createProductVersionsForPlan
        for (const product of products) {
            // Find the latest product version for this product
            const productVersions = await tx
                .select()
                .from(productVersionsTable)
                .where(eq(productVersionsTable.productId, product.id!))
                .orderBy(desc(productVersionsTable.version))
                .limit(1);
            
            if (productVersions.length > 0) {
                await tx.insert(planProductVersionsTable).values({
                    planId,
                    productVersionId: productVersions[0].id,
                });
            }
        }
    }
    
    /**
     * Creates product versions for all products linked to a published plan
     * This ensures immutability - the product state is snapshotted
     */
    private async createProductVersionsForPlan(
        tx: any,
        plan: Plan,
        products: Product[],
    ): Promise<void> {
        for (const product of products) {
            // Check if a product version already exists for this product
            // Get the latest version number
            const existingVersions = await tx
                .select()
                .from(productVersionsTable)
                .where(eq(productVersionsTable.productId, product.id!))
                .orderBy(desc(productVersionsTable.version))
                .limit(1);
            
            const nextVersion = existingVersions.length > 0 
                ? existingVersions[0].version + 1 
                : 1;
            
            // Create product version snapshot
            const productVersion = product.createVersion(nextVersion);
            
            await tx.insert(productVersionsTable).values({
                id: productVersion.id,
                productId: productVersion.productId,
                version: productVersion.version,
                name: productVersion.name,
                description: productVersion.description,
                apiKey: productVersion.apiKey,
                active: productVersion.active,
                metadata: productVersion.metadata,
            });
        }
    }

    /**
     * Saves per-plan feature configuration and tiered pricing.
     */
    private async savePlanFeatureConfigurations(
        tx: any,
        plan: Plan,
        savedProductFeatures: Map<string, Feature[]>,
        featureConfigs: PlanFeatureConfigInput[],
    ): Promise<void> {
        // Create maps for both featureId and featureCode lookups
        const configById = new Map<string, PlanFeatureConfigInput>();
        const configByCode = new Map<string, PlanFeatureConfigInput>();
        
        for (const cfg of featureConfigs) {
            if (cfg.featureId) {
                configById.set(cfg.featureId, cfg);
            }
            if (cfg.featureCode) {
                configByCode.set(cfg.featureCode, cfg);
            }
        }

        // Track which features have been configured to avoid duplicates
        const configuredFeatureIds = new Set<string>();

        // If using featureId, only configure explicitly listed features
        // If using featureCode, configure all features from products (backward compatibility)
        const useFeatureIdMode = featureConfigs.length > 0 && featureConfigs.some(cfg => cfg.featureId);

        if (useFeatureIdMode) {
            // Only configure features explicitly listed by featureId
            for (const cfg of featureConfigs) {
                if (!cfg.featureId) continue;
                
                // Find the feature in the savedProductFeatures map
                let feature: Feature | undefined;
                for (const [, features] of savedProductFeatures) {
                    feature = features.find(f => f.id === cfg.featureId);
                    if (feature) break;
                }

                if (!feature) {
                    throw new Error(`Feature with ID ${cfg.featureId} not found in provided features`);
                }

                if (configuredFeatureIds.has(feature.id!)) {
                    continue;
                }

                const tiers = (cfg.pricingTiers ?? []).map(tier =>
                    new FeaturePricingTier({
                        fromQuantity: tier.fromQuantity,
                        toQuantity: tier.toQuantity,
                        pricePerUnit: tier.pricePerUnit,
                        currency: tier.currency ?? plan.price.currency,
                    }),
                );

                const planFeatureConfig = new PlanFeatureConfig({
                    planId: plan.id,
                    featureId: feature.id!,
                    featureType: feature.featureType,
                    isActive: cfg.isActive ?? true,
                    quotaLimit: cfg.quotaLimit,
                    pricingTiers: tiers,
                });

                configuredFeatureIds.add(feature.id!);

                // Persist plan_features row
                const [planFeatureRow] = await tx
                    .insert(planFeaturesTable)
                    .values({
                        planId: planFeatureConfig.planId,
                        featureId: planFeatureConfig.featureId,
                        isActive: planFeatureConfig.isActive,
                        featureType: planFeatureConfig.featureType,
                        quotaLimit: planFeatureConfig.quotaLimit,
                        metadata: planFeatureConfig.metadata,
                    })
                    .returning();

                // Persist pricing tiers if any
                const pricingTiers = planFeatureConfig.pricingTiers;
                if (pricingTiers.length > 0) {
                    let index = 0;
                    for (const tier of pricingTiers) {
                        await tx.insert(featurePricingTiersTable).values({
                            planFeatureId: planFeatureRow.id,
                            tierIndex: index++,
                            fromQuantity: tier.fromQuantity,
                            toQuantity: tier.toQuantity ?? null,
                            pricePerUnit: tier.pricePerUnit,
                            currency: tier.currency,
                        });
                    }
                }
            }
        } else {
            // Backward compatibility: configure all features from products using featureCode
            for (const [, features] of savedProductFeatures) {
                for (const feature of features) {
                    // Skip if already configured
                    if (configuredFeatureIds.has(feature.id!)) {
                        continue;
                    }

                    // Try to find config by featureCode
                    const cfg = configByCode.get(feature.code);

                    // Create config for all features (backward compatibility)
                    const tiers = (cfg?.pricingTiers ?? []).map(tier =>
                        new FeaturePricingTier({
                            fromQuantity: tier.fromQuantity,
                            toQuantity: tier.toQuantity,
                            pricePerUnit: tier.pricePerUnit,
                            currency: tier.currency ?? plan.price.currency,
                        }),
                    );

                    const planFeatureConfig = new PlanFeatureConfig({
                        planId: plan.id,
                        featureId: feature.id!,
                        featureType: feature.featureType,
                        isActive: cfg?.isActive ?? true,
                        quotaLimit: cfg?.quotaLimit,
                        pricingTiers: tiers,
                    });

                    configuredFeatureIds.add(feature.id!);

                    // Persist plan_features row
                    const [planFeatureRow] = await tx
                        .insert(planFeaturesTable)
                        .values({
                            planId: planFeatureConfig.planId,
                            featureId: planFeatureConfig.featureId,
                            isActive: planFeatureConfig.isActive,
                            featureType: planFeatureConfig.featureType,
                            quotaLimit: planFeatureConfig.quotaLimit,
                            metadata: planFeatureConfig.metadata,
                        })
                        .returning();

                    // Persist pricing tiers if any
                    const pricingTiers = planFeatureConfig.pricingTiers;
                    if (pricingTiers.length > 0) {
                        let index = 0;
                        for (const tier of pricingTiers) {
                            await tx.insert(featurePricingTiersTable).values({
                                planFeatureId: planFeatureRow.id,
                                tierIndex: index++,
                                fromQuantity: tier.fromQuantity,
                                toQuantity: tier.toQuantity ?? null,
                                pricePerUnit: tier.pricePerUnit,
                                currency: tier.currency,
                            });
                        }
                    }
                }
            }
        }
    }
}
