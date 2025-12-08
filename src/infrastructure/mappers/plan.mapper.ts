import { Injectable } from '@nestjs/common';
import { Plan } from '@domain/entities/plan.entity';
import { Price } from '@domain/value-objects/price.vo';
import { RenewalDefinition } from '@domain/value-objects/renewal-definition.vo';
import { TimePeriod } from '@domain/value-objects/time-period.vo';

/**
 * Maps Plan domain entity to/from database representation
 */
@Injectable()
export class PlanMapper {
    /**
     * Converts Plan domain entity to database row format
     */
    toPersistence(plan: Plan): {
        id: string;
        planFamilyId?: string;
        name: string;
        planCode: string;
        planType: string;
        version: number;
        priceId?: string;
        renewalDefinitionId?: string;
        trialPeriodId?: string;
        active: boolean;
        status: 'active' | 'archived' | 'draft';
        metadata?: Record<string, any>;
        createdAt?: Date;
    } {
        return {
            id: plan.id,
            planFamilyId: plan.planFamilyId,
            name: plan.name,
            planCode: plan.planCode,
            planType: plan.planType,
            version: plan.version,
            // IDs will be set after persisting related entities
            active: plan.active,
            status: plan.status,
            metadata: plan.metadata,
            createdAt: plan.createdAt,
        };
    }

    /**
     * Converts database row to Plan domain entity
     * Requires pre-loaded value objects (price, renewal, trial)
     */
    toDomain(
        row: any,
        price: Price,
        renewalDefinition?: RenewalDefinition,
        trialPeriod?: TimePeriod,
    ): Plan {
        return new Plan({
            id: row.id,
            planFamilyId: row.planFamilyId,
            name: row.name,
            planCode: row.planCode,
            planType: row.planType,
            productIds: [], // Will be loaded separately from planProducts table
            price,
            renewalDefinition,
            trialPeriod,
            active: row.active,
            status: row.status,
            metadata: row.metadata,
            createdAt: row.createdAt,
            version: row.version,
        });
    }
}
