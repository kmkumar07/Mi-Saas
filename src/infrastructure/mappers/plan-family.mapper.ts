import { Injectable } from '@nestjs/common';
import { PlanFamily } from '@domain/entities/plan-family.entity';

/**
 * Maps PlanFamily domain entity to/from database representation
 */
@Injectable()
export class PlanFamilyMapper {
    /**
     * Converts PlanFamily domain entity to database row format
     */
    toPersistence(family: PlanFamily): {
        id: string;
        tenantId: string;
        name: string;
        planCode: string;
        metadata?: Record<string, any>;
        createdAt: Date;
        updatedAt: Date;
    } {
        return {
            id: family.id,
            tenantId: family.tenantId,
            name: family.name,
            planCode: family.planCode,
            metadata: family.metadata,
            createdAt: family.createdAt,
            updatedAt: family.updatedAt,
        };
    }

    /**
     * Converts database row to PlanFamily domain entity
     */
    toDomain(row: {
        id: string;
        tenantId: string;
        name: string;
        planCode: string;
        metadata?: unknown;
        createdAt: Date;
        updatedAt: Date;
    }): PlanFamily {
        return PlanFamily.create({
            id: row.id,
            tenantId: row.tenantId,
            name: row.name,
            planCode: row.planCode,
            metadata: row.metadata ? (row.metadata as Record<string, any>) : undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

