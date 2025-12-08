import { Inject, Injectable } from '@nestjs/common';
import { inArray, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PlanFeatureConfig } from '@domain/entities';
import { IPlanFeatureConfigRepository } from '@domain/repositories/plan-feature-config.repository';
import { IPricingModelRepository, PRICING_MODEL_REPOSITORY } from '@domain/repositories/pricing-model.repository';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class PlanFeatureConfigRepository implements IPlanFeatureConfigRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
        @Inject(PRICING_MODEL_REPOSITORY)
        private readonly pricingModelRepository: IPricingModelRepository,
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

        // Load pricing models for these plan features
        const pricingModelsByPlanFeatureId = await this.pricingModelRepository.findByPlanFeatureIds(planFeatureIds);

        return planFeatureRows.map((row) => {
            const pricingModelWithDetails = pricingModelsByPlanFeatureId.get(row.id);
            const pricingModel = pricingModelWithDetails?.model;

            return new PlanFeatureConfig({
                id: row.id,
                planId: row.planId,
                featureId: row.featureId,
                featureType: row.featureType as any,
                isActive: row.isActive,
                quotaLimit: row.quotaLimit ?? undefined,
                pricingModel: pricingModel,
                metadata: row.metadata as Record<string, any> | undefined,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            });
        });
    }
}


