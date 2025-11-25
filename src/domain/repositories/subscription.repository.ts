import { Subscription } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
    create(subscription: Subscription): Promise<Subscription>;
    findById(id: string): Promise<Subscription | null>;
    findByAccountId(accountId: string): Promise<Subscription[]>;
    findActiveByTenantAndCustomer(tenantId: string, customerId?: string): Promise<Subscription[]>;
    findActiveByPlanId(planId: string): Promise<Subscription[]>;
    update(subscription: Subscription): Promise<Subscription>;
    cancel(id: string, reason?: string): Promise<void>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');
