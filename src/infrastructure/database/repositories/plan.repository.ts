import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { Plan } from '@domain/entities';
import { IPlanRepository } from '@domain/repositories';
import {
    Price,
    RecurringChargePeriod,
    RenewalDefinition,
    TimePeriod,
} from '@domain/value-objects';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class PlanRepository implements IPlanRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async create(plan: Plan): Promise<Plan> {
        // Step 1: Insert plan
        const planResult = await this.db
            .insert(schema.plans)
            .values({
                tenantId: plan.tenantId,
                name: plan.name,
                planType: plan.planType,
                active: plan.active,
                metadata: plan.metadata,
            })
            .returning();

        const savedPlan = planResult[0];

        // Step 2: Insert plan-product relationships
        for (const productId of plan.productIds) {
            await this.db.insert(schema.planProducts).values({
                planId: savedPlan.id,
                productId: productId,
            });
        }

        // Step 3: Insert price
        const priceResult = await this.db
            .insert(schema.prices)
            .values({
                planId: savedPlan.id,
                priceId: plan.price.priceId,
                value: plan.price.value,
                currency: plan.price.currency,
                isActive: plan.price.isActive,
                description: plan.price.description,
            })
            .returning();

        // Step 4: Insert recurring charge period
        await this.db.insert(schema.recurringChargePeriods).values({
            priceId: priceResult[0].id,
            recurringChargePeriodId: plan.price.recurringChargePeriod.recurringChargePeriodId,
            chargeFrequency: plan.price.recurringChargePeriod.chargeFrequency,
            startDateTime: plan.price.recurringChargePeriod.startDateTime,
            numberOfPeriods: plan.price.recurringChargePeriod.numberOfPeriods,
        });

        // Step 5: Insert renewal definition (if exists)
        if (plan.renewalDefinition) {
            await this.db.insert(schema.renewalDefinitions).values({
                planId: savedPlan.id,
                isExpirable: plan.renewalDefinition.isExpirable,
                isAutomaticRenewable: plan.renewalDefinition.isAutomaticRenewable,
                renewCycleUnits: plan.renewalDefinition.renewCycleUnits,
                gracePeriodName: plan.renewalDefinition.gracePeriod.name,
                gracePeriodValue: plan.renewalDefinition.gracePeriod.value,
                maxRenewCycles: plan.renewalDefinition.maxRenewCycles,
            });
        }

        // Step 6: Insert trial period (if exists)
        if (plan.trialPeriod) {
            await this.db.insert(schema.trialPeriods).values({
                planId: savedPlan.id,
                timePeriodId: plan.trialPeriod.timePeriodId,
                name: plan.trialPeriod.name,
                value: plan.trialPeriod.value,
            });
        }

        // Return the created plan by fetching it with all related data
        const createdPlan = await this.findById(savedPlan.id);
        if (!createdPlan) {
            throw new Error('Failed to retrieve created plan');
        }
        return createdPlan;
    }

    async findById(id: string): Promise<Plan | null> {
        // Fetch plan
        const planResult = await this.db
            .select()
            .from(schema.plans)
            .where(eq(schema.plans.id, id))
            .limit(1);

        if (planResult.length === 0) {
            return null;
        }

        return this.toDomain(planResult[0]);
    }

    async findByTenantId(tenantId: string): Promise<Plan[]> {
        const results = await this.db
            .select()
            .from(schema.plans)
            .where(eq(schema.plans.tenantId, tenantId));

        return Promise.all(results.map((row) => this.toDomain(row)));
    }

    async findByProductId(productId: string): Promise<Plan[]> {
        // Find plans through the junction table
        const planProductResults = await this.db
            .select()
            .from(schema.planProducts)
            .where(eq(schema.planProducts.productId, productId));

        const plans: Plan[] = [];
        for (const pp of planProductResults) {
            const plan = await this.findById(pp.planId);
            if (plan) {
                plans.push(plan);
            }
        }

        return plans;
    }

    async findAll(): Promise<Plan[]> {
        const results = await this.db.select().from(schema.plans);
        return Promise.all(results.map((row) => this.toDomain(row)));
    }

    async update(plan: Plan): Promise<Plan> {
        if (!plan.id) {
            throw new Error('Cannot update plan without ID');
        }

        // Update plan
        await this.db
            .update(schema.plans)
            .set({
                name: plan.name,
                planType: plan.planType,
                active: plan.active,
                metadata: plan.metadata,
            })
            .where(eq(schema.plans.id, plan.id));

        // Update price
        const priceResult = await this.db
            .select()
            .from(schema.prices)
            .where(eq(schema.prices.planId, plan.id))
            .limit(1);

        if (priceResult.length > 0) {
            await this.db
                .update(schema.prices)
                .set({
                    value: plan.price.value,
                    currency: plan.price.currency,
                    isActive: plan.price.isActive,
                    description: plan.price.description,
                })
                .where(eq(schema.prices.id, priceResult[0].id));
        }

        const updatedPlan = await this.findById(plan.id);
        if (!updatedPlan) {
            throw new Error('Failed to retrieve updated plan');
        }
        return updatedPlan;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(schema.plans).where(eq(schema.plans.id, id));
    }

    private async toDomain(row: schema.Plan): Promise<Plan> {
        // Fetch product IDs
        const planProductResults = await this.db
            .select()
            .from(schema.planProducts)
            .where(eq(schema.planProducts.planId, row.id));

        const productIds = planProductResults.map(pp => pp.productId);

        // Fetch price
        const priceResult = await this.db
            .select()
            .from(schema.prices)
            .where(eq(schema.prices.planId, row.id))
            .limit(1);

        if (priceResult.length === 0) {
            throw new Error(`Price not found for plan ${row.id}`);
        }

        // Fetch recurring charge period
        const rcpResult = await this.db
            .select()
            .from(schema.recurringChargePeriods)
            .where(eq(schema.recurringChargePeriods.priceId, priceResult[0].id))
            .limit(1);

        if (rcpResult.length === 0) {
            throw new Error(`Recurring charge period not found for price ${priceResult[0].id}`);
        }

        const recurringChargePeriod = new RecurringChargePeriod(
            rcpResult[0].chargeFrequency as any,
            rcpResult[0].startDateTime,
            rcpResult[0].numberOfPeriods || undefined,
            rcpResult[0].recurringChargePeriodId || undefined,
        );

        const price = new Price(
            priceResult[0].value,
            priceResult[0].currency,
            recurringChargePeriod,
            priceResult[0].isActive,
            priceResult[0].description || undefined,
            priceResult[0].priceId,
        );

        // Fetch renewal definition (optional)
        let renewalDefinition: RenewalDefinition | undefined;
        const renewalResult = await this.db
            .select()
            .from(schema.renewalDefinitions)
            .where(eq(schema.renewalDefinitions.planId, row.id))
            .limit(1);

        if (renewalResult.length > 0) {
            const gracePeriod = new TimePeriod(
                renewalResult[0].gracePeriodName,
                renewalResult[0].gracePeriodValue,
            );

            renewalDefinition = new RenewalDefinition(
                renewalResult[0].isExpirable,
                renewalResult[0].isAutomaticRenewable,
                renewalResult[0].renewCycleUnits,
                gracePeriod,
                renewalResult[0].maxRenewCycles,
            );
        }

        // Fetch trial period (optional)
        let trialPeriod: TimePeriod | undefined;
        const trialResult = await this.db
            .select()
            .from(schema.trialPeriods)
            .where(eq(schema.trialPeriods.planId, row.id))
            .limit(1);

        if (trialResult.length > 0) {
            trialPeriod = new TimePeriod(
                trialResult[0].name,
                trialResult[0].value,
                trialResult[0].timePeriodId || undefined,
            );
        }

        return new Plan({
            id: row.id,
            tenantId: row.tenantId,
            name: row.name,
            planType: row.planType as any,
            productIds,
            price,
            renewalDefinition,
            trialPeriod,
            active: row.active,
            metadata: row.metadata as Record<string, any>,
            createdAt: row.createdAt,
        });
    }
}
