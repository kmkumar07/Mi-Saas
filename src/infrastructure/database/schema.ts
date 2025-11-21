import { pgTable, uuid, text, varchar, boolean, jsonb, timestamp, bigint, integer, pgEnum } from 'drizzle-orm/pg-core';

// ============================
// ENUM DEFINITIONS
// ============================

export const chargeModelEnum = pgEnum('charge_model', [
    'flat',
    'per_seat',
    'per_api_call',
    'tiered',
    'package',
    'volume',
    'graduated',
]);

export const meterTypeEnum = pgEnum('meter_type', [
    'api_call',
    'event',
    'request',
    'storage',
    'bandwidth',
    'cpu',
    'gpu',
    'custom',
]);

export const featureTypeEnum = pgEnum('feature_type', [
    'boolean',
    'metered',
    'quota',
    'entitlement',
]);

export const billingIntervalEnum = pgEnum('billing_interval', [
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
    'active',
    'trial',
    'past_due',
    'cancelled',
    'incomplete',
    'expired',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
    'draft',
    'open',
    'paid',
    'failed',
    'void',
    'refunded',
]);

export const pricingStrategyEnum = pgEnum('pricing_strategy', [
    'static',
    'metered',
    'hybrid',
    'usage_only',
    'seat_based',
    'feature_based',
]);

export const planTypeEnum = pgEnum('plan_type', [
    'free',
    'standard',
    'pro',
    'enterprise',
]);

export const chargeFrequencyEnum = pgEnum('charge_frequency', [
    'one-time',
    'monthly',
    'fortnightly',
    'weekly',
    'daily',
    'hourly',
    'per-minute',
    'per-second',
]);

// ============================
// TABLE DEFINITIONS
// ============================

export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    emailDomain: varchar('email_domain', { length: 255 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
        .references(() => tenants.id, { onDelete: 'cascade' })
        .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    apiKey: text('api_key'),
    active: boolean('active').default(true).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const features = pgTable('features', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
        .references(() => products.id, { onDelete: 'cascade' })
        .notNull(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    featureType: featureTypeEnum('feature_type').notNull(),
    chargeModel: chargeModelEnum('charge_model').notNull(),
    serviceUrl: text('service_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
        .references(() => tenants.id, { onDelete: 'cascade' })
        .notNull(),
    name: text('name').notNull(),
    planType: planTypeEnum('plan_type').notNull(),
    active: boolean('active').default(true).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Plan-Product junction table (many-to-many relationship)
export const planProducts = pgTable('plan_products', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'cascade' })
        .notNull(),
    productId: uuid('product_id')
        .references(() => products.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Prices table (one price per plan)
export const prices = pgTable('prices', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'cascade' })
        .unique()
        .notNull(),
    priceId: varchar('price_id', { length: 255 }).notNull(),
    value: bigint('value', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Recurring charge periods (embedded in price)
export const recurringChargePeriods = pgTable('recurring_charge_periods', {
    id: uuid('id').primaryKey().defaultRandom(),
    priceId: uuid('price_id')
        .references(() => prices.id, { onDelete: 'cascade' })
        .notNull(),
    recurringChargePeriodId: varchar('recurring_charge_period_id', { length: 255 }),
    chargeFrequency: chargeFrequencyEnum('charge_frequency').notNull(),
    startDateTime: timestamp('start_date_time').notNull(),
    numberOfPeriods: integer('number_of_periods'),
});

// Renewal definitions
export const renewalDefinitions = pgTable('renewal_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'cascade' })
        .unique(),
    isExpirable: boolean('is_expirable').default(false).notNull(),
    isAutomaticRenewable: boolean('is_automatic_renewable').default(true).notNull(),
    renewCycleUnits: varchar('renew_cycle_units', { length: 50 }).notNull(),
    gracePeriodName: varchar('grace_period_name', { length: 50 }).notNull(),
    gracePeriodValue: integer('grace_period_value').notNull(),
    maxRenewCycles: integer('max_renew_cycles').notNull(),
});

// Trial periods
export const trialPeriods = pgTable('trial_periods', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'cascade' })
        .unique(),
    timePeriodId: varchar('time_period_id', { length: 255 }),
    name: varchar('name', { length: 50 }).notNull(),
    value: integer('value').notNull(),
});

export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
        .references(() => tenants.id, { onDelete: 'cascade' })
        .notNull(),
    customerId: uuid('customer_id').notNull(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'restrict' })
        .notNull(),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    seats: integer('seats').default(1),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usageAggregates = pgTable('usage_aggregates', {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
        .references(() => subscriptions.id, { onDelete: 'cascade' })
        .notNull(),
    featureId: uuid('feature_id')
        .references(() => features.id, { onDelete: 'cascade' })
        .notNull(),
    meterKey: meterTypeEnum('meter_key').notNull(),
    totalQuantity: bigint('total_quantity', { mode: 'number' }).notNull().default(0),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
        .references(() => tenants.id, { onDelete: 'cascade' })
        .notNull(),
    customerId: uuid('customer_id').notNull(),
    subscriptionId: uuid('subscription_id')
        .references(() => subscriptions.id, { onDelete: 'restrict' })
        .notNull(),
    amountDueCents: bigint('amount_due_cents', { mode: 'number' }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    dueDate: timestamp('due_date').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================
// TYPE EXPORTS
// ============================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type PlanProduct = typeof planProducts.$inferSelect;
export type NewPlanProduct = typeof planProducts.$inferInsert;

export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;

export type RecurringChargePeriod = typeof recurringChargePeriods.$inferSelect;
export type NewRecurringChargePeriod = typeof recurringChargePeriods.$inferInsert;

export type RenewalDefinition = typeof renewalDefinitions.$inferSelect;
export type NewRenewalDefinition = typeof renewalDefinitions.$inferInsert;

export type TrialPeriod = typeof trialPeriods.$inferSelect;
export type NewTrialPeriod = typeof trialPeriods.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type UsageAggregate = typeof usageAggregates.$inferSelect;
export type NewUsageAggregate = typeof usageAggregates.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
