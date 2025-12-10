import { UsageEvent } from '../entities/usage-event.entity';

export interface AggregatedUsage {
    featureCode: string;
    totalQuantity: number;
}

export interface IUsageEventRepository {
    create(event: UsageEvent): Promise<UsageEvent>;
    findBySubscription(subscriptionId: string, startDate?: Date, endDate?: Date): Promise<UsageEvent[]>;
    getAggregatedUsage(tenantId: string, customerId?: string, startDate?: Date, endDate?: Date): Promise<AggregatedUsage[]>;
    findByIdempotencyKey(idempotencyKey: string): Promise<UsageEvent | null>;
}

export const USAGE_EVENT_REPOSITORY = Symbol('USAGE_EVENT_REPOSITORY');
