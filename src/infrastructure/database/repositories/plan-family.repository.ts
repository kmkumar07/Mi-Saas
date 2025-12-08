import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { PlanFamily } from '@domain/entities';
import { IPlanFamilyRepository } from '@domain/repositories';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';
import { PlanFamilyMapper } from '@infrastructure/mappers/plan-family.mapper';

@Injectable()
export class PlanFamilyRepository implements IPlanFamilyRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
        private readonly mapper: PlanFamilyMapper,
    ) { }

    async create(family: PlanFamily): Promise<PlanFamily> {
        const familyData = this.mapper.toPersistence(family);
        const result = await this.db
            .insert(schema.planFamilies)
            .values(familyData)
            .returning();

        return this.mapper.toDomain(result[0]);
    }

    async findById(id: string): Promise<PlanFamily | null> {
        const result = await this.db
            .select()
            .from(schema.planFamilies)
            .where(eq(schema.planFamilies.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.mapper.toDomain(result[0]);
    }

    async findByPlanCode(tenantId: string, planCode: string): Promise<PlanFamily | null> {
        const result = await this.db
            .select()
            .from(schema.planFamilies)
            .where(
                and(
                    eq(schema.planFamilies.tenantId, tenantId),
                    eq(schema.planFamilies.planCode, planCode),
                ),
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.mapper.toDomain(result[0]);
    }

    async findByTenantId(tenantId: string): Promise<PlanFamily[]> {
        const result = await this.db
            .select()
            .from(schema.planFamilies)
            .where(eq(schema.planFamilies.tenantId, tenantId));

        return result.map(row => this.mapper.toDomain(row));
    }

    async update(family: PlanFamily): Promise<PlanFamily> {
        const familyData = this.mapper.toPersistence(family);
        const result = await this.db
            .update(schema.planFamilies)
            .set({
                name: familyData.name,
                planCode: familyData.planCode,
                metadata: familyData.metadata,
                updatedAt: new Date(),
            })
            .where(eq(schema.planFamilies.id, family.id))
            .returning();

        if (result.length === 0) {
            throw new Error(`PlanFamily with ID ${family.id} not found`);
        }

        return this.mapper.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.planFamilies)
            .where(eq(schema.planFamilies.id, id));
    }
}

