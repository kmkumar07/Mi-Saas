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
        name: string;
        planCode: string;
        rank: number;
        metadata?: Record<string, any>;
        createdAt: Date;
        updatedAt: Date;
    } {
        return {
            id: family.id,
            name: family.name,
            planCode: family.planCode,
            rank: family.rank,
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
        name: string;
        planCode: string;
        rank?: number;
        metadata?: unknown;
        createdAt: Date;
        updatedAt: Date;
    }): PlanFamily {
        return PlanFamily.create({
            id: row.id,
            name: row.name,
            planCode: row.planCode,
            rank: row.rank,
            metadata: row.metadata ? (row.metadata as Record<string, any>) : undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

