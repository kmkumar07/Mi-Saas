import { Inject, Injectable } from '@nestjs/common';
import { inArray, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { IPricingModelRepository, PricingModelWithDetails } from '@domain/repositories/pricing-model.repository';
import { PricingModel, PerUserPricing, PerUsagePricing, TieredPricing, TieredPricingTier, VolumePricing, VolumePricingVolume, GraduatedPricing, GraduatedPricingTier } from '@domain/value-objects';
import { ChargeModel } from '@domain/enums';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class PricingModelRepository implements IPricingModelRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findByPlanFeatureIds(planFeatureIds: string[]): Promise<Map<string, PricingModelWithDetails>> {
        const result = new Map<string, PricingModelWithDetails>();

        if (!planFeatureIds.length) {
            return result;
        }

        // Load base pricing models
        const pricingModelRows = await this.db
            .select()
            .from(schema.pricingModels)
            .where(inArray(schema.pricingModels.planFeatureId, planFeatureIds));

        if (pricingModelRows.length === 0) {
            return result;
        }

        const pricingModelIds = pricingModelRows.map(row => row.id);

        // Load type-specific data based on pricing model type
        const perUserRows = await this.db
            .select()
            .from(schema.perUserPricing)
            .where(inArray(schema.perUserPricing.pricingModelId, pricingModelIds));

        const perUsageRows = await this.db
            .select()
            .from(schema.perUsagePricing)
            .where(inArray(schema.perUsagePricing.pricingModelId, pricingModelIds));

        const tieredTierRows = await this.db
            .select()
            .from(schema.tieredPricingTiers)
            .where(inArray(schema.tieredPricingTiers.pricingModelId, pricingModelIds))
            .orderBy(schema.tieredPricingTiers.tierIndex);

        const volumeRows = await this.db
            .select()
            .from(schema.volumePricingVolumes)
            .where(inArray(schema.volumePricingVolumes.pricingModelId, pricingModelIds))
            .orderBy(schema.volumePricingVolumes.volumeIndex);

        const graduatedTierRows = await this.db
            .select()
            .from(schema.graduatedPricingTiers)
            .where(inArray(schema.graduatedPricingTiers.pricingModelId, pricingModelIds))
            .orderBy(schema.graduatedPricingTiers.tierIndex);

        // Group tiers/volumes by pricing model ID
        const tieredTiersByModelId = new Map<string, TieredPricingTier[]>();
        for (const row of tieredTierRows) {
            const tier = new TieredPricingTier({
                id: row.id,
                pricingModelId: row.pricingModelId,
                tierIndex: row.tierIndex,
                fromQuantity: row.fromQuantity,
                toQuantity: row.toQuantity ?? null,
                pricePerUnit: row.pricePerUnit,
                unitName: row.unitName,
            });
            const list = tieredTiersByModelId.get(row.pricingModelId) ?? [];
            list.push(tier);
            tieredTiersByModelId.set(row.pricingModelId, list);
        }

        const volumeVolumesByModelId = new Map<string, VolumePricingVolume[]>();
        for (const row of volumeRows) {
            const volume = new VolumePricingVolume({
                id: row.id,
                pricingModelId: row.pricingModelId,
                volumeIndex: row.volumeIndex,
                maxVolume: row.maxVolume ?? null,
                pricePerUnit: row.pricePerUnit,
                unitName: row.unitName,
            });
            const list = volumeVolumesByModelId.get(row.pricingModelId) ?? [];
            list.push(volume);
            volumeVolumesByModelId.set(row.pricingModelId, list);
        }

        const graduatedTiersByModelId = new Map<string, GraduatedPricingTier[]>();
        for (const row of graduatedTierRows) {
            const tier = new GraduatedPricingTier({
                id: row.id,
                pricingModelId: row.pricingModelId,
                tierIndex: row.tierIndex,
                fromQuantity: row.fromQuantity,
                toQuantity: row.toQuantity ?? null,
                pricePerUnit: row.pricePerUnit,
                unitName: row.unitName,
            });
            const list = graduatedTiersByModelId.get(row.pricingModelId) ?? [];
            list.push(tier);
            graduatedTiersByModelId.set(row.pricingModelId, list);
        }

        // Build result map
        for (const row of pricingModelRows) {
            const type = row.type as ChargeModel;
            let pricingModelWithDetails: PricingModelWithDetails;

            switch (type) {
                case ChargeModel.PER_USER: {
                    const perUserRow = perUserRows.find(r => r.pricingModelId === row.id);
                    if (!perUserRow) continue;
                    const perUserPricing = new PerUserPricing({
                        id: perUserRow.id,
                        pricingModelId: row.id,
                        pricePerUser: perUserRow.pricePerUser,
                        minUsers: perUserRow.minUsers,
                    });
                    pricingModelWithDetails = { type: ChargeModel.PER_USER, model: perUserPricing };
                    break;
                }
                case ChargeModel.PER_USAGE: {
                    const perUsageRow = perUsageRows.find(r => r.pricingModelId === row.id);
                    if (!perUsageRow) continue;
                    const perUsagePricing = new PerUsagePricing({
                        id: perUsageRow.id,
                        pricingModelId: row.id,
                        pricePerUnit: perUsageRow.pricePerUnit,
                        unitName: perUsageRow.unitName,
                    });
                    pricingModelWithDetails = { type: ChargeModel.PER_USAGE, model: perUsagePricing };
                    break;
                }
                case ChargeModel.TIERED: {
                    const tiers = tieredTiersByModelId.get(row.id) ?? [];
                    if (tiers.length === 0) continue;
                    const unitName = tiers[0].unitName;
                    const tieredPricing = new TieredPricing(row.id, tiers, unitName);
                    pricingModelWithDetails = { type: ChargeModel.TIERED, model: tieredPricing };
                    break;
                }
                case ChargeModel.VOLUME: {
                    const volumes = volumeVolumesByModelId.get(row.id) ?? [];
                    if (volumes.length === 0) continue;
                    const unitName = volumes[0].unitName;
                    const volumePricing = new VolumePricing(row.id, volumes, unitName);
                    pricingModelWithDetails = { type: ChargeModel.VOLUME, model: volumePricing };
                    break;
                }
                case ChargeModel.GRADUATED: {
                    const tiers = graduatedTiersByModelId.get(row.id) ?? [];
                    if (tiers.length === 0) continue;
                    const unitName = tiers[0].unitName;
                    const graduatedPricing = new GraduatedPricing(row.id, tiers, unitName);
                    pricingModelWithDetails = { type: ChargeModel.GRADUATED, model: graduatedPricing };
                    break;
                }
                default:
                    continue;
            }

            result.set(row.planFeatureId, pricingModelWithDetails);
        }

        return result;
    }

    async save(pricingModel: PricingModel, details: PricingModelWithDetails): Promise<void> {
        // Save base pricing model
        const [savedModel] = await this.db
            .insert(schema.pricingModels)
            .values({
                id: pricingModel.id,
                planFeatureId: pricingModel.planFeatureId,
                type: pricingModel.type,
                currency: pricingModel.currency,
                details: pricingModel.details,
                createdAt: pricingModel.createdAt,
            })
            .returning();

        // Save type-specific data
        switch (details.type) {
            case ChargeModel.PER_USER: {
                await this.db.insert(schema.perUserPricing).values({
                    id: details.model.id,
                    pricingModelId: savedModel.id,
                    pricePerUser: details.model.pricePerUser,
                    minUsers: details.model.minUsers,
                });
                break;
            }
            case ChargeModel.PER_USAGE: {
                await this.db.insert(schema.perUsagePricing).values({
                    id: details.model.id,
                    pricingModelId: savedModel.id,
                    pricePerUnit: details.model.pricePerUnit,
                    unitName: details.model.unitName,
                });
                break;
            }
            case ChargeModel.TIERED: {
                const tieredPricing = details.model as TieredPricing;
                if (tieredPricing.tiers.length > 0) {
                    await this.db.insert(schema.tieredPricingTiers).values(
                        tieredPricing.tiers.map(tier => ({
                            id: tier.id,
                            pricingModelId: savedModel.id,
                            tierIndex: tier.tierIndex,
                            fromQuantity: tier.fromQuantity,
                            toQuantity: tier.toQuantity ?? null,
                            pricePerUnit: tier.pricePerUnit,
                            unitName: tier.unitName,
                        }))
                    );
                }
                break;
            }
            case ChargeModel.VOLUME: {
                const volumePricing = details.model as VolumePricing;
                if (volumePricing.volumes.length > 0) {
                    await this.db.insert(schema.volumePricingVolumes).values(
                        volumePricing.volumes.map(volume => ({
                            id: volume.id,
                            pricingModelId: savedModel.id,
                            volumeIndex: volume.volumeIndex,
                            maxVolume: volume.maxVolume ?? null,
                            pricePerUnit: volume.pricePerUnit,
                            unitName: volume.unitName,
                        }))
                    );
                }
                break;
            }
            case ChargeModel.GRADUATED: {
                const graduatedPricing = details.model as GraduatedPricing;
                if (graduatedPricing.tiers.length > 0) {
                    await this.db.insert(schema.graduatedPricingTiers).values(
                        graduatedPricing.tiers.map(tier => ({
                            id: tier.id,
                            pricingModelId: savedModel.id,
                            tierIndex: tier.tierIndex,
                            fromQuantity: tier.fromQuantity,
                            toQuantity: tier.toQuantity ?? null,
                            pricePerUnit: tier.pricePerUnit,
                            unitName: tier.unitName,
                        }))
                    );
                }
                break;
            }
        }
    }

    async deleteByPlanFeatureIds(planFeatureIds: string[]): Promise<void> {
        if (!planFeatureIds.length) return;

        // Get pricing model IDs
        const pricingModelRows = await this.db
            .select()
            .from(schema.pricingModels)
            .where(inArray(schema.pricingModels.planFeatureId, planFeatureIds));

        if (pricingModelRows.length === 0) return;

        const pricingModelIds = pricingModelRows.map(row => row.id);

        // Delete type-specific data (cascade should handle this, but being explicit)
        await this.db.delete(schema.perUserPricing).where(inArray(schema.perUserPricing.pricingModelId, pricingModelIds));
        await this.db.delete(schema.perUsagePricing).where(inArray(schema.perUsagePricing.pricingModelId, pricingModelIds));
        await this.db.delete(schema.tieredPricingTiers).where(inArray(schema.tieredPricingTiers.pricingModelId, pricingModelIds));
        await this.db.delete(schema.volumePricingVolumes).where(inArray(schema.volumePricingVolumes.pricingModelId, pricingModelIds));
        await this.db.delete(schema.graduatedPricingTiers).where(inArray(schema.graduatedPricingTiers.pricingModelId, pricingModelIds));

        // Delete base pricing models
        await this.db.delete(schema.pricingModels).where(inArray(schema.pricingModels.id, pricingModelIds));
    }
}

