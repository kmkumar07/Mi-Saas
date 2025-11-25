import { Inject, Injectable } from '@nestjs/common';
import { inArray, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PlanFeatureConfig } from '@domain/entities';
import { FeaturePricingTier as TierVO } from '@domain/value-objects';
import { IPlanFeatureConfigRepository } from '@domain/repositories/plan-feature-config.repository';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class PlanFeatureConfigRepository implements IPlanFeatureConfigRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findByPlanIds(planIds: string[]): Promise<PlanFeatureConfig[]> {
        if (!planIds.length) return [];

        const planFeatureRows = await this.db
            .select()
            .from(schema.planFeatures)
            .where(inArray(schema.planFeatures.planId, planIds));

        if (planFeatureRows.length === 0) {
            return [];
        }

        const planFeatureIds = planFeatureRows.map((row) => row.id);

        const tierRows = await this.db
            .select()
            .from(schema.featurePricingTiers)
            .where(inArray(schema.featurePricingTiers.planFeatureId, planFeatureIds));

        const tiersByPlanFeatureId = new Map<string, TierVO[]>();
        for (const row of tierRows) {
            const vo = new TierVO({
                id: row.id,
                planFeatureConfigId: row.planFeatureId,
                fromQuantity: row.fromQuantity,
                toQuantity: row.toQuantity ?? undefined,
                pricePerUnit: row.pricePerUnit,
                currency: row.currency,
            });
            const list = tiersByPlanFeatureId.get(row.planFeatureId) ?? [];
            list.push(vo);
            tiersByPlanFeatureId.set(row.planFeatureId, list);
        }

        return planFeatureRows.map((row) => {
            const tiers = tiersByPlanFeatureId.get(row.id) ?? [];
            return new PlanFeatureConfig({
                id: row.id,
                planId: row.planId,
                featureId: row.featureId,
                featureType: row.featureType as any,
                isActive: row.isActive,
                quotaLimit: row.quotaLimit ?? undefined,
                pricingTiers: tiers,
                metadata: row.metadata as Record<string, any> | undefined,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            });
        });
    }
}


