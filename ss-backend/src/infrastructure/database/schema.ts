import { pgTable, uuid, text, varchar, boolean, jsonb, timestamp, bigint, integer, pgEnum, unique } from 'drizzle-orm/pg-core';

// ============================
// ENUM DEFINITIONS
// ============================

export const chargeModelEnum = pgEnum('charge_model', [
    'flat',
    'per_user',
    'per_usage',
    'tiered',
    'volume',
    'graduated',
]);

export const pricingModelTypeEnum = pgEnum('pricing_model_type', [
    'per_user',
    'per_usage',
    'tiered',
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

export const paymentStatusEnum = pgEnum('payment_status', [
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'partially_refunded',
]);

export const accountStatusEnum = pgEnum('account_status', [
    'active',
    'suspended',
    'closed',
]);

export const paymentOrderStatusEnum = pgEnum('payment_order_status', [
    'pending',
    'created',
    'attempted',
    'paid',
    'failed',
]);


// ============================
// TABLE DEFINITIONS
// ============================

export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    emailDomain: varchar('email_domain', { length: 255 }),
    accountType: varchar('account_type', { length: 50 }),
    workspaceName: text('workspace_name'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts: ReturnType<typeof pgTable> = pgTable('accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
        .references(() => tenants.id, { onDelete: 'cascade' })
        .notNull(),
    parentAccountId: uuid('parent_account_id')
        .references((): any => accounts.id, { onDelete: 'set null' }),

    // Company Information
    companyName: text('company_name').notNull(),
    legalName: text('legal_name'),
    taxId: varchar('tax_id', { length: 50 }),

    // Billing Address
    billingEmail: varchar('billing_email', { length: 255 }).notNull(),
    billingAddressLine1: text('billing_address_line1'),
    billingAddressLine2: text('billing_address_line2'),
    billingCity: varchar('billing_city', { length: 100 }),
    billingState: varchar('billing_state', { length: 100 }),
    billingPostalCode: varchar('billing_postal_code', { length: 20 }),
    billingCountry: varchar('billing_country', { length: 2 }), // ISO 3166-1 alpha-2

    // Payment Information
    paymentMethod: varchar('payment_method', { length: 50 }), // 'card', 'bank_transfer', 'invoice'
    paymentGatewayCustomerId: text('payment_gateway_customer_id'), // Stripe/PayPal customer ID

    // Account Status
    accountStatus: accountStatusEnum('account_status').default('active').notNull(),
    creditLimit: bigint('credit_limit', { mode: 'number' }),
    currentBalance: bigint('current_balance', { mode: 'number' }).default(0),

    // Metadata
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    apiKey: text('api_key'),
    active: boolean('active').default(true).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Product versions table - snapshots of products when linked to published plans
export const productVersions = pgTable('product_versions', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
        .references(() => products.id, { onDelete: 'cascade' })
        .notNull(),
    version: integer('version').notNull().default(1),
    name: text('name').notNull(),
    description: text('description'),
    apiKey: text('api_key'),
    active: boolean('active').default(true).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    productVersionUnique: unique().on(table.productId, table.version),
}));

export const features = pgTable('features', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
        .references(() => products.id, { onDelete: 'cascade' })
        .notNull(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    featureType: featureTypeEnum('feature_type').notNull(),
    chargeModel: chargeModelEnum('charge_model'), // Optional - charge model determined by pricing model on plan-features
    serviceUrl: text('service_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const planStatusEnum = pgEnum('plan_status', [
    'active',
    'archived',
    'draft',
    'published',
]);

export const planFamilies = pgTable('plan_families', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    planCode: text('plan_code').notNull(),
    rank: integer('rank').notNull().default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    planCodeUnique: unique().on(table.planCode),
}));

export const plans = pgTable('plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    planFamilyId: uuid('plan_family_id')
        .references(() => planFamilies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    planCode: text('plan_code').notNull(), // Denormalized from plan_families for fast lookups
    planType: planTypeEnum('plan_type').notNull(),
    version: integer('version').notNull().default(1),
    status: planStatusEnum('status').default('draft').notNull(), // Default to draft for new plans
    active: boolean('active').default(true).notNull(), // Deprecated, use status instead
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    planFamilyVersionUnique: unique().on(table.planFamilyId, table.version),
}));

// Plan-Product junction table (many-to-many relationship)
// For draft plans, links directly to products
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

// Plan-Product Versions junction table (for published plans)
// Links published plans to specific product versions for immutability
export const planProductVersions = pgTable('plan_product_versions', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'cascade' })
        .notNull(),
    productVersionId: uuid('product_version_id')
        .references(() => productVersions.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    planProductVersionUnique: unique().on(table.planId, table.productVersionId),
}));

// Per-plan feature configuration
export const planFeatures = pgTable('plan_features', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'cascade' })
        .notNull(),
    featureId: uuid('feature_id')
        .references(() => features.id, { onDelete: 'cascade' })
        .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    featureType: featureTypeEnum('feature_type').notNull(),
    quotaLimit: integer('quota_limit'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tiered pricing for metered plan features (deprecated - kept for backward compatibility)
export const featurePricingTiers = pgTable('feature_pricing_tiers', {
    id: uuid('id').primaryKey().defaultRandom(),
    planFeatureId: uuid('plan_feature_id')
        .references(() => planFeatures.id, { onDelete: 'cascade' })
        .notNull(),
    tierIndex: integer('tier_index').notNull(),
    fromQuantity: integer('from_quantity').notNull(),
    toQuantity: integer('to_quantity'),
    pricePerUnit: bigint('price_per_unit', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Pricing models base table
export const pricingModels = pgTable('pricing_models', {
    id: uuid('id').primaryKey().defaultRandom(),
    planFeatureId: uuid('plan_feature_id')
        .references(() => planFeatures.id, { onDelete: 'cascade' })
        .notNull(),
    type: pricingModelTypeEnum('type').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    details: jsonb('details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Per-user pricing model
export const perUserPricing = pgTable('per_user_pricing', {
    id: uuid('id').primaryKey().defaultRandom(),
    pricingModelId: uuid('pricing_model_id')
        .references(() => pricingModels.id, { onDelete: 'cascade' })
        .notNull()
        .unique(),
    pricePerUser: bigint('price_per_user', { mode: 'number' }).notNull(),
    minUsers: integer('min_users').notNull().default(1),
});

// Per-usage pricing model
export const perUsagePricing = pgTable('per_usage_pricing', {
    id: uuid('id').primaryKey().defaultRandom(),
    pricingModelId: uuid('pricing_model_id')
        .references(() => pricingModels.id, { onDelete: 'cascade' })
        .notNull()
        .unique(),
    pricePerUnit: bigint('price_per_unit', { mode: 'number' }).notNull(),
    unitName: varchar('unit_name', { length: 100 }).notNull(),
});

// Tiered pricing tiers
export const tieredPricingTiers = pgTable('tiered_pricing_tiers', {
    id: uuid('id').primaryKey().defaultRandom(),
    pricingModelId: uuid('pricing_model_id')
        .references(() => pricingModels.id, { onDelete: 'cascade' })
        .notNull(),
    tierIndex: integer('tier_index').notNull(),
    fromQuantity: integer('from_quantity').notNull(),
    toQuantity: integer('to_quantity'),
    pricePerUnit: bigint('price_per_unit', { mode: 'number' }).notNull(),
    unitName: varchar('unit_name', { length: 100 }).notNull(),
});

// Volume pricing volumes
export const volumePricingVolumes = pgTable('volume_pricing_volumes', {
    id: uuid('id').primaryKey().defaultRandom(),
    pricingModelId: uuid('pricing_model_id')
        .references(() => pricingModels.id, { onDelete: 'cascade' })
        .notNull(),
    volumeIndex: integer('volume_index').notNull(),
    maxVolume: integer('max_volume'),
    pricePerUnit: bigint('price_per_unit', { mode: 'number' }).notNull(),
    unitName: varchar('unit_name', { length: 100 }).notNull(),
});

// Graduated pricing tiers
export const graduatedPricingTiers = pgTable('graduated_pricing_tiers', {
    id: uuid('id').primaryKey().defaultRandom(),
    pricingModelId: uuid('pricing_model_id')
        .references(() => pricingModels.id, { onDelete: 'cascade' })
        .notNull(),
    tierIndex: integer('tier_index').notNull(),
    fromQuantity: integer('from_quantity').notNull(),
    toQuantity: integer('to_quantity'),
    pricePerUnit: bigint('price_per_unit', { mode: 'number' }).notNull(),
    unitName: varchar('unit_name', { length: 100 }).notNull(),
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
    accountId: uuid('account_id')
        .references(() => accounts.id, { onDelete: 'cascade' })
        .notNull(),
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
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
        .references(() => accounts.id, { onDelete: 'cascade' })
        .notNull(),
    subscriptionId: uuid('subscription_id')
        .references(() => subscriptions.id, { onDelete: 'set null' }),

    // Payment Details
    amount: bigint('amount', { mode: 'number' }).notNull(), // Amount in cents
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),

    // Gateway Information
    gatewayPaymentId: text('gateway_payment_id'), // Stripe/PayPal transaction ID
    gatewayCustomerId: text('gateway_customer_id'),
    paymentMethod: varchar('payment_method', { length: 50 }), // 'card', 'bank', etc.

    // Payment Type
    paymentType: varchar('payment_type', { length: 50 }).notNull(), // 'subscription', 'upgrade', 'addon'
    description: text('description'),

    // Refund tracking
    refundedAmount: bigint('refunded_amount', { mode: 'number' }).default(0),

    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentTransactions = pgTable('payment_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
        .references(() => payments.id, { onDelete: 'cascade' })
        .notNull(),

    previousStatus: paymentStatusEnum('previous_status'),
    newStatus: paymentStatusEnum('new_status').notNull(),

    amount: bigint('amount', { mode: 'number' }),
    gatewayResponse: jsonb('gateway_response'),
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usageEvents = pgTable('usage_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
        .references(() => tenants.id, { onDelete: 'cascade' })
        .notNull(),
    customerId: uuid('customer_id'), // Optional - can track usage at tenant level
    subscriptionId: uuid('subscription_id')
        .references(() => subscriptions.id, { onDelete: 'set null' }),
    featureCode: varchar('feature_code', { length: 100 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    metadata: jsonb('metadata'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
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

export const paymentOrders = pgTable('payment_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
        .references(() => accounts.id, { onDelete: 'cascade' })
        .notNull(),
    subscriptionId: uuid('subscription_id')
        .references(() => subscriptions.id, { onDelete: 'set null' }),
    planId: uuid('plan_id')
        .references(() => plans.id, { onDelete: 'restrict' })
        .notNull(),
    paymentId: uuid('payment_id')
        .references(() => payments.id, { onDelete: 'set null' }),
    razorpayOrderId: text('razorpay_order_id').notNull().unique(),
    amount: bigint('amount', { mode: 'number' }).notNull(), // Amount in paise/cents
    currency: varchar('currency', { length: 3 }).default('INR').notNull(),
    status: paymentOrderStatusEnum('status').default('pending').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: text('event_id').notNull().unique(), // Razorpay event ID for idempotency
    eventType: varchar('event_type', { length: 100 }).notNull(), // payment.captured, payment.failed, etc.
    paymentOrderId: uuid('payment_order_id')
        .references(() => paymentOrders.id, { onDelete: 'set null' }),
    paymentId: uuid('payment_id')
        .references(() => payments.id, { onDelete: 'set null' }),
    payload: jsonb('payload').notNull(), // Full webhook payload
    signature: text('signature'), // Stored signature for audit
    processed: boolean('processed').default(false).notNull(),
    processedAt: timestamp('processed_at'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================
// TYPE EXPORTS
// ============================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductVersion = typeof productVersions.$inferSelect;
export type NewProductVersion = typeof productVersions.$inferInsert;

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;

export type PlanFamily = typeof planFamilies.$inferSelect;
export type NewPlanFamily = typeof planFamilies.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

export type PlanProduct = typeof planProducts.$inferSelect;
export type NewPlanProduct = typeof planProducts.$inferInsert;

export type PlanProductVersion = typeof planProductVersions.$inferSelect;
export type NewPlanProductVersion = typeof planProductVersions.$inferInsert;

export type PlanFeature = typeof planFeatures.$inferSelect;
export type NewPlanFeature = typeof planFeatures.$inferInsert;

export type FeaturePricingTier = typeof featurePricingTiers.$inferSelect;
export type NewFeaturePricingTier = typeof featurePricingTiers.$inferInsert;

export type PricingModel = typeof pricingModels.$inferSelect;
export type NewPricingModel = typeof pricingModels.$inferInsert;

export type PerUserPricing = typeof perUserPricing.$inferSelect;
export type NewPerUserPricing = typeof perUserPricing.$inferInsert;

export type PerUsagePricing = typeof perUsagePricing.$inferSelect;
export type NewPerUsagePricing = typeof perUsagePricing.$inferInsert;

export type TieredPricingTier = typeof tieredPricingTiers.$inferSelect;
export type NewTieredPricingTier = typeof tieredPricingTiers.$inferInsert;

export type VolumePricingVolume = typeof volumePricingVolumes.$inferSelect;
export type NewVolumePricingVolume = typeof volumePricingVolumes.$inferInsert;

export type GraduatedPricingTier = typeof graduatedPricingTiers.$inferSelect;
export type NewGraduatedPricingTier = typeof graduatedPricingTiers.$inferInsert;

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

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;

export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;

export type UsageAggregate = typeof usageAggregates.$inferSelect;
export type NewUsageAggregate = typeof usageAggregates.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type NewPaymentOrder = typeof paymentOrders.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
