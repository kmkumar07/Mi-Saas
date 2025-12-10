import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
    tenants,
    accounts,
    products,
    features,
    plans,
    planProducts,
    planFamilies,
    planFeatures,
    prices,
    recurringChargePeriods,
    renewalDefinitions,
    trialPeriods,
    subscriptions,
    payments,
    paymentTransactions,
    usageEvents,
    pricingModels,
    perUserPricing,
    perUsagePricing,
    tieredPricingTiers,
    volumePricingVolumes,
    graduatedPricingTiers,
} from './schema';

async function seed() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ag_saas';
    console.log(connectionString);
    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log('🌱 Starting database seed...');

    try {
        // 0. Clean up existing data (in reverse order of dependencies)
        console.log('Cleaning up existing data...');
        await db.delete(usageEvents);
        await db.delete(paymentTransactions);
        await db.delete(payments);
        await db.delete(subscriptions);
        await db.delete(trialPeriods);
        await db.delete(renewalDefinitions);
        await db.delete(recurringChargePeriods);
        await db.delete(prices);
        await db.delete(graduatedPricingTiers);
        await db.delete(volumePricingVolumes);
        await db.delete(tieredPricingTiers);
        await db.delete(perUsagePricing);
        await db.delete(perUserPricing);
        await db.delete(pricingModels);
        await db.delete(planFeatures);
        await db.delete(planProducts);
        await db.delete(plans);
        await db.delete(planFamilies);
        await db.delete(features);
        await db.delete(products);
        await db.delete(accounts);
        await db.delete(tenants);
        console.log('✓ Existing data cleaned');

        // 1. Create Tenants
        console.log('Creating tenants...');
        const [tenant1, tenant2] = await db.insert(tenants).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Acme Corporation',
                emailDomain: 'acme.com',
                metadata: { industry: 'Technology', size: 'Enterprise' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'StartupXYZ',
                emailDomain: 'startupxyz.com',
                metadata: { industry: 'SaaS', size: 'Startup' },
            },
        ]).returning();

        // 2. Create Products
        console.log('Creating products...');
        const [product1, product2, product3] = await db.insert(products).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440011',
                name: 'API Access',
                description: 'Core API access with rate limiting',
                apiKey: 'api_key_product_1',
                active: true,
                metadata: { category: 'Core' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440012',
                name: 'Analytics Dashboard',
                description: 'Advanced analytics and reporting features',
                apiKey: 'api_key_product_2',
                active: true,
                metadata: { category: 'Analytics' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440013',
                name: 'Premium Support',
                description: '24/7 priority support with dedicated account manager',
                apiKey: 'api_key_product_3',
                active: true,
                metadata: { category: 'Support' },
            },
        ]).returning();

        // 3. Create Features with examples for each charge model
        console.log('Creating features...');
        await db.insert(features).values([
            // Features for API Access Product
            {
                id: '550e8400-e29b-41d4-a716-446655440021',
                productId: product1.id,
                name: 'API Calls - Per Usage',
                code: 'api_calls_per_usage',
                description: 'Charged per API call made',
                featureType: 'metered',
                chargeModel: 'per_usage',
                serviceUrl: 'https://api.example.com/meter/api_calls',
                metadata: { unit: 'calls' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440022',
                productId: product1.id,
                name: 'Active Users - Per User',
                code: 'active_users_per_user',
                description: 'Charged per active user per month',
                featureType: 'metered',
                chargeModel: 'per_user',
                serviceUrl: 'https://api.example.com/meter/users',
                metadata: { unit: 'users' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440023',
                productId: product1.id,
                name: 'Messages - Tiered',
                code: 'messages_tiered',
                description: 'Tiered pricing for messages sent',
                featureType: 'metered',
                chargeModel: 'tiered',
                serviceUrl: 'https://api.example.com/meter/messages',
                metadata: { unit: 'messages' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440024',
                productId: product1.id,
                name: 'Events - Volume',
                code: 'events_volume',
                description: 'Volume pricing for events tracked',
                featureType: 'metered',
                chargeModel: 'volume',
                serviceUrl: 'https://api.example.com/meter/events',
                metadata: { unit: 'events' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440025',
                productId: product1.id,
                name: 'API Calls - Graduated',
                code: 'api_calls_graduated',
                description: 'Graduated pricing for API calls',
                featureType: 'metered',
                chargeModel: 'graduated',
                serviceUrl: 'https://api.example.com/meter/api_calls_graduated',
                metadata: { unit: 'calls' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440026',
                productId: product1.id,
                name: 'Webhook Support',
                code: 'webhook_support',
                description: 'Enable webhook notifications',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440027',
                productId: product1.id,
                name: 'API Keys',
                code: 'api_keys_quota',
                description: 'Number of API keys allowed',
                featureType: 'quota',
                chargeModel: 'flat',
                metadata: { max: 10 },
            },
            // Features for Analytics Dashboard Product
            {
                id: '550e8400-e29b-41d4-a716-446655440028',
                productId: product2.id,
                name: 'Custom Reports',
                code: 'custom_reports',
                description: 'Create custom analytics reports',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440029',
                productId: product2.id,
                name: 'Data Retention',
                code: 'data_retention_days',
                description: 'Number of days to retain analytics data',
                featureType: 'quota',
                chargeModel: 'flat',
                metadata: { days: 90 },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440030',
                productId: product2.id,
                name: 'Export Data',
                code: 'export_data',
                description: 'Export analytics data to CSV/Excel',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { formats: ['csv', 'excel'] },
            },
            // Features for Premium Support Product
            {
                id: '550e8400-e29b-41d4-a716-446655440031',
                productId: product3.id,
                name: 'Priority Support',
                code: 'priority_support',
                description: '24/7 priority support access',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { sla: '1 hour response time' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440032',
                productId: product3.id,
                name: 'Dedicated Account Manager',
                code: 'dedicated_account_manager',
                description: 'Assigned dedicated account manager',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { included: true },
            },
        ]);

        // 4. Create Plans (BASIC, PRO, PREMIUM)
        console.log('Creating plans...');
        const [basicPlanOriginal, proPlanOriginal, premiumPlanOriginal] = await db.insert(plans).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440031',
                name: 'BASIC',
                planCode: 'BASIC',
                planType: 'standard',
                status: 'active',
                active: true,
                metadata: { description: 'Perfect for getting started' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440032',
                name: 'PRO',
                planCode: 'PRO',
                planType: 'pro',
                status: 'active',
                active: true,
                metadata: { description: 'For professional teams', popular: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440033',
                name: 'PREMIUM',
                planCode: 'PREMIUM',
                planType: 'enterprise',
                status: 'active',
                active: true,
                metadata: { description: 'For large organizations' },
            },
        ]).returning();

        // 5. Create Plan-Product Associations
        console.log('Creating plan-product associations...');
        await db.insert(planProducts).values([
            // BASIC Plan - Only API Access
            { planId: basicPlanOriginal.id, productId: product1.id },
            // PRO Plan - API Access + Analytics
            { planId: proPlanOriginal.id, productId: product1.id },
            { planId: proPlanOriginal.id, productId: product2.id },
            // PREMIUM Plan - All Products
            { planId: premiumPlanOriginal.id, productId: product1.id },
            { planId: premiumPlanOriginal.id, productId: product2.id },
            { planId: premiumPlanOriginal.id, productId: product3.id },
        ]);

        // 6. Create Prices
        console.log('Creating prices...');
        const [basicPriceOriginal, proPriceOriginal, premiumPriceOriginal] = await db.insert(prices).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440041',
                planId: basicPlanOriginal.id,
                priceId: 'price_basic_001',
                value: 2900, // $29.00
                currency: 'USD',
                isActive: true,
                description: 'Basic monthly subscription',
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440042',
                planId: proPlanOriginal.id,
                priceId: 'price_pro_001',
                value: 9900, // $99.00
                currency: 'USD',
                isActive: true,
                description: 'PRO monthly subscription',
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440043',
                planId: premiumPlanOriginal.id,
                priceId: 'price_premium_001',
                value: 29900, // $299.00
                currency: 'USD',
                isActive: true,
                description: 'Premium monthly subscription',
            },
        ]).returning();

        // 7. Create Recurring Charge Periods
        console.log('Creating recurring charge periods...');
        await db.insert(recurringChargePeriods).values([
            {
                priceId: basicPriceOriginal.id,
                recurringChargePeriodId: 'rcp_basic_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null, // Indefinite
            },
            {
                priceId: proPriceOriginal.id,
                recurringChargePeriodId: 'rcp_pro_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null,
            },
            {
                priceId: premiumPriceOriginal.id,
                recurringChargePeriodId: 'rcp_premium_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null,
            },
        ]);

        // 8. Create Trial Periods (for paid plans)
        console.log('Creating trial periods...');
        await db.insert(trialPeriods).values([
            {
                planId: basicPlanOriginal.id,
                timePeriodId: 'trial_basic_001',
                name: '14-day trial',
                value: 14,
            },
            {
                planId: proPlanOriginal.id,
                timePeriodId: 'trial_pro_001',
                name: '14-day trial',
                value: 14,
            },
            {
                planId: premiumPlanOriginal.id,
                timePeriodId: 'trial_premium_001',
                name: '30-day trial',
                value: 30,
            },
        ]);

        // 9. Create Renewal Definitions (for paid plans)
        console.log('Creating renewal definitions...');
        await db.insert(renewalDefinitions).values([
            {
                planId: basicPlanOriginal.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '7-day grace period',
                gracePeriodValue: 7,
                maxRenewCycles: 0, // Unlimited
            },
            {
                planId: proPlanOriginal.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '7-day grace period',
                gracePeriodValue: 7,
                maxRenewCycles: 0,
            },
            {
                planId: premiumPlanOriginal.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '14-day grace period',
                gracePeriodValue: 14,
                maxRenewCycles: 0,
            },
        ]);

        // 10. Create Accounts
        console.log('Creating accounts...');
        const [account1, account2, account3, account4] = await db.insert(accounts).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440051',
                tenantId: tenant1.id,
                companyName: 'Acme Corp Billing',
                legalName: 'Acme Corporation Inc.',
                taxId: 'US-123456789',
                billingEmail: 'billing@acme.com',
                billingAddressLine1: '123 Tech Street',
                billingCity: 'San Francisco',
                billingState: 'CA',
                billingPostalCode: '94102',
                billingCountry: 'US',
                paymentMethod: 'card',
                paymentGatewayCustomerId: 'cus_acme_001',
                accountStatus: 'active',
                creditLimit: 1000000, // $10,000 in cents
                currentBalance: 0,
                metadata: { department: 'Finance', contactPerson: 'John Doe' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440052',
                tenantId: tenant1.id,
                parentAccountId: '550e8400-e29b-41d4-a716-446655440051', // Child account
                companyName: 'Acme Corp - Engineering Division',
                billingEmail: 'eng-billing@acme.com',
                billingAddressLine1: '123 Tech Street',
                billingCity: 'San Francisco',
                billingState: 'CA',
                billingPostalCode: '94102',
                billingCountry: 'US',
                paymentMethod: 'invoice',
                accountStatus: 'active',
                metadata: { division: 'Engineering', parentAccount: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440053',
                tenantId: tenant2.id,
                companyName: 'StartupXYZ Inc',
                billingEmail: 'finance@startupxyz.com',
                billingAddressLine1: '456 Startup Ave',
                billingCity: 'Austin',
                billingState: 'TX',
                billingPostalCode: '78701',
                billingCountry: 'US',
                paymentMethod: 'card',
                paymentGatewayCustomerId: 'cus_startup_001',
                accountStatus: 'active',
                creditLimit: 50000, // $500 in cents
                currentBalance: 0,
                metadata: { stage: 'Series A' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440054',
                tenantId: tenant1.id,
                companyName: 'Acme Corp - Suspended Account',
                billingEmail: 'suspended@acme.com',
                accountStatus: 'suspended',
                metadata: { reason: 'Payment overdue' },
            },
        ]).returning();

        // 10. Create Plan Features with Pricing Models
        console.log('Creating plan features with pricing models...');
        
        // Get feature IDs
        const apiCallsPerUsageFeature = '550e8400-e29b-41d4-a716-446655440021';
        const activeUsersPerUserFeature = '550e8400-e29b-41d4-a716-446655440022';
        const messagesTieredFeature = '550e8400-e29b-41d4-a716-446655440023';
        const eventsVolumeFeature = '550e8400-e29b-41d4-a716-446655440024';
        const apiCallsGraduatedFeature = '550e8400-e29b-41d4-a716-446655440025';
        const webhookSupportFeature = '550e8400-e29b-41d4-a716-446655440026';
        const apiKeysQuotaFeature = '550e8400-e29b-41d4-a716-446655440027';

        // BASIC Plan Features - Minimum features only
        const [basicPlanFeature1, basicPlanFeature2, basicPlanFeature3] = await db.insert(planFeatures).values([
            {
                planId: basicPlanOriginal.id,
                featureId: apiCallsPerUsageFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: basicPlanOriginal.id,
                featureId: activeUsersPerUserFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: basicPlanOriginal.id,
                featureId: apiKeysQuotaFeature,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 5,
            },
        ]).returning();

        // PRO Plan Features - Medium features (includes all Basic features + more)
        const [proPlanFeature1, proPlanFeature2, proPlanFeature3, proPlanFeature4, proPlanFeature5, proPlanFeature6] = await db.insert(planFeatures).values([
            {
                planId: proPlanOriginal.id,
                featureId: apiCallsPerUsageFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: proPlanOriginal.id,
                featureId: activeUsersPerUserFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: proPlanOriginal.id,
                featureId: messagesTieredFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: proPlanOriginal.id,
                featureId: eventsVolumeFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: proPlanOriginal.id,
                featureId: webhookSupportFeature,
                isActive: true,
                featureType: 'boolean',
            },
            {
                planId: proPlanOriginal.id,
                featureId: apiKeysQuotaFeature,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 20,
            },
        ]).returning();

        // PREMIUM Plan Features
        const [premiumPlanFeature1, premiumPlanFeature2, premiumPlanFeature3, premiumPlanFeature4, premiumPlanFeature5, premiumPlanFeature6, premiumPlanFeature7] = await db.insert(planFeatures).values([
            {
                planId: premiumPlanOriginal.id,
                featureId: apiCallsPerUsageFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: premiumPlanOriginal.id,
                featureId: activeUsersPerUserFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: premiumPlanOriginal.id,
                featureId: messagesTieredFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: premiumPlanOriginal.id,
                featureId: eventsVolumeFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: premiumPlanOriginal.id,
                featureId: apiCallsGraduatedFeature,
                isActive: true,
                featureType: 'metered',
            },
            {
                planId: premiumPlanOriginal.id,
                featureId: webhookSupportFeature,
                isActive: true,
                featureType: 'boolean',
            },
            {
                planId: premiumPlanOriginal.id,
                featureId: apiKeysQuotaFeature,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 100,
            },
        ]).returning();

        // Create Pricing Models for BASIC Plan
        console.log('Creating pricing models for BASIC plan...');
        
        // Per-usage pricing for BASIC
        const [basicPerUsagePricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440101',
                planFeatureId: basicPlanFeature1.id,
                type: 'per_usage',
                currency: 'USD',
                details: { description: 'Flat rate charged per API call.' },
            },
        ]).returning();
        await db.insert(perUsagePricing).values([
            {
                pricingModelId: basicPerUsagePricingModel.id,
                pricePerUnit: 2, // $0.002 per call
                unitName: 'api_call',
            },
        ]);

        // Per-user pricing for BASIC
        const [basicPerUserPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440102',
                planFeatureId: basicPlanFeature2.id,
                type: 'per_user',
                currency: 'USD',
                details: { description: 'Flat rate charged per active user per month.' },
            },
        ]).returning();
        await db.insert(perUserPricing).values([
            {
                pricingModelId: basicPerUserPricingModel.id,
                pricePerUser: 1500, // $15.00 per user
                minUsers: 1,
            },
        ]);

        // Tiered pricing for BASIC
        const [basicTieredPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440103',
                planFeatureId: basicPlanFeature3.id,
                type: 'tiered',
                currency: 'USD',
                details: { description: 'Tiered pricing where pricing depends on which tier the total usage falls into.' },
            },
        ]).returning();
        await db.insert(tieredPricingTiers).values([
            {
                pricingModelId: basicTieredPricingModel.id,
                tierIndex: 0,
                fromQuantity: 1,
                toQuantity: 1000,
                pricePerUnit: 5, // $0.005 per message
                unitName: 'message',
            },
            {
                pricingModelId: basicTieredPricingModel.id,
                tierIndex: 1,
                fromQuantity: 1001,
                toQuantity: 10000,
                pricePerUnit: 3, // $0.003 per message
                unitName: 'message',
            },
            {
                pricingModelId: basicTieredPricingModel.id,
                tierIndex: 2,
                fromQuantity: 10001,
                toQuantity: null,
                pricePerUnit: 1, // $0.001 per message (1 cent = $0.01, but stored as 1 for minimum)
                unitName: 'message',
            },
        ]);

        // Create Pricing Models for PRO Plan
        console.log('Creating pricing models for PRO plan...');
        
        // Per-usage pricing for PRO
        const [proPerUsagePricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440201',
                planFeatureId: proPlanFeature1.id,
                type: 'per_usage',
                currency: 'USD',
                details: { description: 'Flat rate charged per API call.' },
            },
        ]).returning();
        await db.insert(perUsagePricing).values([
            {
                pricingModelId: proPerUsagePricingModel.id,
                pricePerUnit: 1, // $0.001 per call (better rate for PRO)
                unitName: 'api_call',
            },
        ]);

        // Per-user pricing for PRO
        const [proPerUserPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440202',
                planFeatureId: proPlanFeature2.id,
                type: 'per_user',
                currency: 'USD',
                details: { description: 'Flat rate charged per active user per month.' },
            },
        ]).returning();
        await db.insert(perUserPricing).values([
            {
                pricingModelId: proPerUserPricingModel.id,
                pricePerUser: 1200, // $12.00 per user (better rate for PRO)
                minUsers: 1,
            },
        ]);

        // Tiered pricing for PRO
        const [proTieredPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440203',
                planFeatureId: proPlanFeature3.id,
                type: 'tiered',
                currency: 'USD',
                details: { description: 'Tiered pricing where pricing depends on which tier the total usage falls into.' },
            },
        ]).returning();
        await db.insert(tieredPricingTiers).values([
            {
                pricingModelId: proTieredPricingModel.id,
                tierIndex: 0,
                fromQuantity: 1,
                toQuantity: 5000,
                pricePerUnit: 4, // $0.004 per message
                unitName: 'message',
            },
            {
                pricingModelId: proTieredPricingModel.id,
                tierIndex: 1,
                fromQuantity: 5001,
                toQuantity: 50000,
                pricePerUnit: 2, // $0.002 per message
                unitName: 'message',
            },
            {
                pricingModelId: proTieredPricingModel.id,
                tierIndex: 2,
                fromQuantity: 50001,
                toQuantity: null,
                pricePerUnit: 10, // $0.001 per message (100 in cents = 1 cent)
                unitName: 'message',
            },
        ]);

        // Volume pricing for PRO
        const [proVolumePricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440204',
                planFeatureId: proPlanFeature4.id,
                type: 'volume',
                currency: 'USD',
                details: { description: 'Volume pricing applies a single price based on total usage volume.' },
            },
        ]).returning();
        await db.insert(volumePricingVolumes).values([
            {
                pricingModelId: proVolumePricingModel.id,
                volumeIndex: 0,
                maxVolume: 50000,
                pricePerUnit: 3, // $0.003 per event
                unitName: 'event',
            },
            {
                pricingModelId: proVolumePricingModel.id,
                volumeIndex: 1,
                maxVolume: 200000,
                pricePerUnit: 2, // $0.002 per event
                unitName: 'event',
            },
            {
                pricingModelId: proVolumePricingModel.id,
                volumeIndex: 2,
                maxVolume: null,
                pricePerUnit: 1, // $0.001 per event
                unitName: 'event',
            },
        ]);

        // Create Pricing Models for PREMIUM Plan
        console.log('Creating pricing models for PREMIUM plan...');
        
        // Per-usage pricing for PREMIUM
        const [premiumPerUsagePricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440301',
                planFeatureId: premiumPlanFeature1.id,
                type: 'per_usage',
                currency: 'USD',
                details: { description: 'Flat rate charged per API call.' },
            },
        ]).returning();
        await db.insert(perUsagePricing).values([
            {
                pricingModelId: premiumPerUsagePricingModel.id,
                pricePerUnit: 1, // $0.001 per call (best rate for PREMIUM)
                unitName: 'api_call',
            },
        ]);

        // Per-user pricing for PREMIUM
        const [premiumPerUserPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440302',
                planFeatureId: premiumPlanFeature2.id,
                type: 'per_user',
                currency: 'USD',
                details: { description: 'Flat rate charged per active user per month.' },
            },
        ]).returning();
        await db.insert(perUserPricing).values([
            {
                pricingModelId: premiumPerUserPricingModel.id,
                pricePerUser: 1000, // $10.00 per user (best rate for PREMIUM)
                minUsers: 1,
            },
        ]);

        // Tiered pricing for PREMIUM
        const [premiumTieredPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440303',
                planFeatureId: premiumPlanFeature3.id,
                type: 'tiered',
                currency: 'USD',
                details: { description: 'Tiered pricing where pricing depends on which tier the total usage falls into.' },
            },
        ]).returning();
        await db.insert(tieredPricingTiers).values([
            {
                pricingModelId: premiumTieredPricingModel.id,
                tierIndex: 0,
                fromQuantity: 1,
                toQuantity: 10000,
                pricePerUnit: 3, // $0.003 per message
                unitName: 'message',
            },
            {
                pricingModelId: premiumTieredPricingModel.id,
                tierIndex: 1,
                fromQuantity: 10001,
                toQuantity: 100000,
                pricePerUnit: 1, // $0.001 per message
                unitName: 'message',
            },
            {
                pricingModelId: premiumTieredPricingModel.id,
                tierIndex: 2,
                fromQuantity: 100001,
                toQuantity: null,
                pricePerUnit: 1, // $0.001 per message (best rate for PREMIUM)
                unitName: 'message',
            },
        ]);

        // Volume pricing for PREMIUM
        const [premiumVolumePricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440304',
                planFeatureId: premiumPlanFeature4.id,
                type: 'volume',
                currency: 'USD',
                details: { description: 'Volume pricing applies a single price based on total usage volume.' },
            },
        ]).returning();
        await db.insert(volumePricingVolumes).values([
            {
                pricingModelId: premiumVolumePricingModel.id,
                volumeIndex: 0,
                maxVolume: 100000,
                pricePerUnit: 2, // $0.002 per event
                unitName: 'event',
            },
            {
                pricingModelId: premiumVolumePricingModel.id,
                volumeIndex: 1,
                maxVolume: 1000000,
                pricePerUnit: 1, // $0.001 per event
                unitName: 'event',
            },
            {
                pricingModelId: premiumVolumePricingModel.id,
                volumeIndex: 2,
                maxVolume: null,
                pricePerUnit: 1, // $0.001 per event (best rate for PREMIUM)
                unitName: 'event',
            },
        ]);

        // Graduated pricing for PREMIUM
        const [premiumGraduatedPricingModel] = await db.insert(pricingModels).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440305',
                planFeatureId: premiumPlanFeature5.id,
                type: 'graduated',
                currency: 'USD',
                details: { description: 'Graduated pricing applies different prices for each tier segment of usage.' },
            },
        ]).returning();
        await db.insert(graduatedPricingTiers).values([
            {
                pricingModelId: premiumGraduatedPricingModel.id,
                tierIndex: 0,
                fromQuantity: 1,
                toQuantity: 10000,
                pricePerUnit: 6, // $0.006 per call
                unitName: 'call',
            },
            {
                pricingModelId: premiumGraduatedPricingModel.id,
                tierIndex: 1,
                fromQuantity: 10001,
                toQuantity: 50000,
                pricePerUnit: 4, // $0.004 per call
                unitName: 'call',
            },
            {
                pricingModelId: premiumGraduatedPricingModel.id,
                tierIndex: 2,
                fromQuantity: 50001,
                toQuantity: null,
                pricePerUnit: 2, // $0.002 per call
                unitName: 'call',
            },
        ]);

        // 11. Create Subscriptions
        console.log('Creating subscriptions...');
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

        const [sub1, sub2, sub3] = await db.insert(subscriptions).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440061',
                accountId: account1.id,
                tenantId: tenant1.id,
                customerId: '550e8400-e29b-41d4-a716-446655440081', // UUID for customer-001
                planId: basicPlanOriginal.id,
                status: 'active',
                seats: 5,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                metadata: { source: 'website', campaign: 'spring2024' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440062',
                accountId: account2.id,
                tenantId: tenant1.id,
                customerId: '550e8400-e29b-41d4-a716-446655440082', // UUID for customer-002
                planId: proPlanOriginal.id,
                status: 'active',
                seats: 10,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                metadata: { source: 'sales', team: 'engineering' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440063',
                accountId: account3.id,
                tenantId: tenant2.id,
                customerId: '550e8400-e29b-41d4-a716-446655440083', // UUID for customer-003
                planId: basicPlanOriginal.id,
                status: 'trial',
                seats: 3,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                metadata: { source: 'referral' },
            },
        ]).returning();

        // 12. Create Payments
        console.log('Creating payments...');
        const [payment1, payment2, payment3] = await db.insert(payments).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440071',
                accountId: account1.id,
                subscriptionId: sub1.id,
                amount: 2900, // $29.00
                currency: 'USD',
                status: 'completed',
                gatewayPaymentId: 'pay_acme_001',
                gatewayCustomerId: 'cus_acme_001',
                paymentMethod: 'card',
                paymentType: 'subscription',
                description: 'BASIC Plan - Monthly subscription',
                refundedAmount: 0,
                metadata: { invoiceId: 'INV-001' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440072',
                accountId: account2.id,
                subscriptionId: sub2.id,
                amount: 9900, // $99.00
                currency: 'USD',
                status: 'completed',
                gatewayPaymentId: 'pay_acme_002',
                gatewayCustomerId: 'cus_acme_001',
                paymentMethod: 'invoice',
                paymentType: 'subscription',
                description: 'PRO Plan - Monthly subscription',
                refundedAmount: 0,
                metadata: { invoiceId: 'INV-002', poNumber: 'PO-2024-001' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440073',
                accountId: account3.id,
                subscriptionId: sub3.id,
                amount: 2900, // $29.00
                currency: 'USD',
                status: 'pending',
                gatewayCustomerId: 'cus_startup_001',
                paymentMethod: 'card',
                paymentType: 'subscription',
                description: 'BASIC Plan - Trial conversion payment',
                refundedAmount: 0,
                metadata: { trialConversion: true },
            },
        ]).returning();

        // 13. Create Payment Transactions
        console.log('Creating payment transactions...');
        await db.insert(paymentTransactions).values([
            {
                paymentId: payment1.id,
                previousStatus: null,
                newStatus: 'pending',
                amount: 2900,
                gatewayResponse: { message: 'Payment initiated' },
            },
            {
                paymentId: payment1.id,
                previousStatus: 'pending',
                newStatus: 'processing',
                amount: 2900,
                gatewayResponse: { message: 'Payment processing' },
            },
            {
                paymentId: payment1.id,
                previousStatus: 'processing',
                newStatus: 'completed',
                amount: 2900,
                gatewayResponse: {
                    message: 'Payment successful',
                    transactionId: 'txn_001',
                    cardLast4: '4242',
                },
            },
            {
                paymentId: payment2.id,
                previousStatus: null,
                newStatus: 'completed',
                amount: 9900,
                gatewayResponse: {
                    message: 'Invoice payment recorded',
                    invoiceNumber: 'INV-002',
                },
            },
        ]);

        // 14. Create Usage Events
        console.log('Creating usage events...');
        await db.insert(usageEvents).values([
            {
                tenantId: tenant1.id,
                customerId: '550e8400-e29b-41d4-a716-446655440081', // customer-001
                subscriptionId: sub1.id,
                featureCode: 'api_rate_limit',
                quantity: 150,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                metadata: { endpoint: '/api/v1/users', method: 'GET' },
                idempotencyKey: 'usage_001',
            },
            {
                tenantId: tenant1.id,
                customerId: '550e8400-e29b-41d4-a716-446655440081', // customer-001
                subscriptionId: sub1.id,
                featureCode: 'api_rate_limit',
                quantity: 200,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
                metadata: { endpoint: '/api/v1/products', method: 'GET' },
                idempotencyKey: 'usage_002',
            },
            {
                tenantId: tenant1.id,
                customerId: '550e8400-e29b-41d4-a716-446655440082', // customer-002
                subscriptionId: sub2.id,
                featureCode: 'api_rate_limit',
                quantity: 500,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
                metadata: { endpoint: '/api/v1/analytics', method: 'POST' },
                idempotencyKey: 'usage_003',
            },
            {
                tenantId: tenant2.id,
                customerId: '550e8400-e29b-41d4-a716-446655440083', // customer-003
                subscriptionId: sub3.id,
                featureCode: 'api_rate_limit',
                quantity: 50,
                timestamp: new Date(),
                metadata: { endpoint: '/api/v1/reports', method: 'GET' },
                idempotencyKey: 'usage_004',
            },
        ]);

        // ============================================
        // SNAP FLOW PRODUCT SEED DATA
        // ============================================
        console.log('\n🌱 Creating Snap Flow product and plans...');

        // Create Snap Flow Product
        const [snapFlowProduct] = await db.insert(products).values([
            {
                id: '660e8400-e29b-41d4-a716-446655440001',
                name: 'snap flow',
                description: 'Complete studio management solution with billing, photo selection, client management, and more',
                apiKey: 'api_key_snap_flow',
                active: true,
                metadata: { category: 'Studio Management', industry: 'Photography' },
            },
        ]).returning();

        // Create Snap Flow Features
        console.log('Creating Snap Flow features...');
        const snapFlowFeatures = await db.insert(features).values([
            {
                id: '660e8400-e29b-41d4-a716-446655440101',
                productId: snapFlowProduct.id,
                name: 'Studio Shops',
                code: 'studio_shops',
                description: 'Number of studio shops allowed',
                featureType: 'quota',
                chargeModel: 'flat',
                metadata: { unit: 'shops' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440102',
                productId: snapFlowProduct.id,
                name: 'Indoor Billing',
                code: 'indoor_billing',
                description: 'Unlimited indoor billing',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { unlimited: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440103',
                productId: snapFlowProduct.id,
                name: 'Outdoor Billing',
                code: 'outdoor_billing',
                description: 'Unlimited outdoor billing',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { unlimited: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440104',
                productId: snapFlowProduct.id,
                name: 'Photo Selection Albums',
                code: 'photo_selection_albums',
                description: 'Number of photo selection albums allowed',
                featureType: 'quota',
                chargeModel: 'flat',
                metadata: { unit: 'albums' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440105',
                productId: snapFlowProduct.id,
                name: 'File Storage',
                code: 'file_storage',
                description: 'File storage capacity in GB',
                featureType: 'quota',
                chargeModel: 'flat',
                metadata: { unit: 'GB' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440106',
                productId: snapFlowProduct.id,
                name: 'Email Notifications',
                code: 'email_notifications',
                description: 'Email notification support',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440107',
                productId: snapFlowProduct.id,
                name: 'Whatsapp Notifications',
                code: 'whatsapp_notifications',
                description: 'WhatsApp notification support',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440108',
                productId: snapFlowProduct.id,
                name: 'SMS Notifications',
                code: 'sms_notifications',
                description: 'SMS notification support',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440109',
                productId: snapFlowProduct.id,
                name: 'Social Media Integration',
                code: 'social_media_integration',
                description: 'Integrate WhatsApp, Instagram, Facebook Business Accounts',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { platforms: ['whatsapp', 'instagram', 'facebook'] },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440110',
                productId: snapFlowProduct.id,
                name: 'Marketing Tools',
                code: 'marketing_tools',
                description: 'Marketing tools and campaigns',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440111',
                productId: snapFlowProduct.id,
                name: 'Expense Management',
                code: 'expense_management',
                description: 'Track and manage expenses',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440112',
                productId: snapFlowProduct.id,
                name: 'Client Management',
                code: 'client_management',
                description: 'Manage clients and contacts',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440113',
                productId: snapFlowProduct.id,
                name: 'Report Management',
                code: 'report_management',
                description: 'Generate and manage reports',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440114',
                productId: snapFlowProduct.id,
                name: 'AI Assistant',
                code: 'ai_assistant',
                description: 'AI-powered assistant for studio management',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440115',
                productId: snapFlowProduct.id,
                name: 'AI Image Assistant',
                code: 'ai_image_assistant',
                description: 'AI-powered image editing and enhancement',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
        ]).returning();

        // Create Plan Families for Snap Flow
        // Each tier (Basic, PRO, Premium) has its own plan family for versioning.
        // When updating a plan, archive the old version and create a new one with incremented version in the same family.
        console.log('Creating Snap Flow plan families...');
        const [basicPlanFamily, proPlanFamily, premiumPlanFamily] = await db.insert(planFamilies).values([
            {
                id: '660e8400-e29b-41d4-a716-446655440201',
                name: 'Snap Flow Basic',
                planCode: 'SNAP_FLOW_BASIC',
                rank: 1,
                metadata: { product: 'snap flow', tier: 'basic', description: 'Basic tier plan family for versioning' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440202',
                name: 'Snap Flow PRO',
                planCode: 'SNAP_FLOW_PRO',
                rank: 2,
                metadata: { product: 'snap flow', tier: 'pro', description: 'PRO tier plan family for versioning' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440203',
                name: 'Snap Flow Premium',
                planCode: 'SNAP_FLOW_PREMIUM',
                rank: 3,
                metadata: { product: 'snap flow', tier: 'premium', description: 'Premium tier plan family for versioning' },
            },
        ]).returning();

        // Create Snap Flow Plans (version 1 for each tier)
        // Each plan is linked to its plan family for versioning purposes.
        // To update: archive current plan (status: 'archived') and create new plan with version 2 in same family.
        console.log('Creating Snap Flow plans (v1)...');
        const [basicPlan, proPlanSnap, premiumPlan] = await db.insert(plans).values([
            {
                id: '660e8400-e29b-41d4-a716-446655440301',
                planFamilyId: basicPlanFamily.id,
                name: 'Basic',
                planCode: 'SNAP_FLOW_BASIC',
                planType: 'standard',
                version: 1,
                status: 'published',
                active: true,
                metadata: { description: 'Perfect for small studios with basic needs', product: 'snap flow', tier: 'basic' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440302',
                planFamilyId: proPlanFamily.id,
                name: 'PRO',
                planCode: 'SNAP_FLOW_PRO',
                planType: 'pro',
                version: 1,
                status: 'published',
                active: true,
                metadata: { description: 'For professional photographers and studios', product: 'snap flow', tier: 'pro' },
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440303',
                planFamilyId: premiumPlanFamily.id,
                name: 'Premium',
                planCode: 'SNAP_FLOW_PREMIUM',
                planType: 'enterprise',
                version: 1,
                status: 'published',
                active: true,
                metadata: { description: 'Complete solution with AI features for large studios', product: 'snap flow', tier: 'premium' },
            },
        ]).returning();

        // Create Plan-Product Associations
        console.log('Creating plan-product associations for Snap Flow...');
        await db.insert(planProducts).values([
            { planId: basicPlan.id, productId: snapFlowProduct.id },
            { planId: proPlanSnap.id, productId: snapFlowProduct.id },
            { planId: premiumPlan.id, productId: snapFlowProduct.id },
        ]);

        // Create Plan Features with configurations
        console.log('Creating plan features for Snap Flow...');
        
        // Create a map for easy feature lookup by code
        const featureMap = new Map(snapFlowFeatures.map(f => [f.code, f]));
        const getFeature = (code: string) => {
            const feature = featureMap.get(code);
            if (!feature) {
                throw new Error(`Feature with code '${code}' not found`);
            }
            return feature;
        };

        // Basic Plan Features - Minimum features only
        await db.insert(planFeatures).values([
            // Studio Shops: 1
            {
                planId: basicPlan.id,
                featureId: getFeature('studio_shops').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 1,
                metadata: { description: '1 studio shop' },
            },
            // Indoor Billing: Unlimited
            {
                planId: basicPlan.id,
                featureId: getFeature('indoor_billing').id,
                isActive: true,
                featureType: 'boolean',
                metadata: { unlimited: true },
            },
            // Outdoor Billing: Unlimited
            {
                planId: basicPlan.id,
                featureId: getFeature('outdoor_billing').id,
                isActive: true,
                featureType: 'boolean',
                metadata: { unlimited: true },
            },
            // Photo Selection Albums: 2
            {
                planId: basicPlan.id,
                featureId: getFeature('photo_selection_albums').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 2,
                metadata: { description: '2 albums' },
            },
            // File Storage: 10GB
            {
                planId: basicPlan.id,
                featureId: getFeature('file_storage').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 10,
                metadata: { unit: 'GB', description: '10GB storage' },
            },
            // Email Notifications
            {
                planId: basicPlan.id,
                featureId: getFeature('email_notifications').id,
                isActive: true,
                featureType: 'boolean',
            },
        ]);

        // PRO Plan Features - Medium features (includes all Basic features + more)
        await db.insert(planFeatures).values([
            // Studio Shops: 2 (more than Basic)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('studio_shops').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 2,
                metadata: { description: '2 studio shops' },
            },
            // Indoor Billing: Unlimited
            {
                planId: proPlanSnap.id,
                featureId: getFeature('indoor_billing').id,
                isActive: true,
                featureType: 'boolean',
                metadata: { unlimited: true },
            },
            // Outdoor Billing: Unlimited
            {
                planId: proPlanSnap.id,
                featureId: getFeature('outdoor_billing').id,
                isActive: true,
                featureType: 'boolean',
                metadata: { unlimited: true },
            },
            // Photo Selection Albums: Unlimited (more than Basic)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('photo_selection_albums').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: null, // null means unlimited
                metadata: { unlimited: true },
            },
            // File Storage: 100GB (more than Basic)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('file_storage').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 100,
                metadata: { unit: 'GB', description: '100GB storage' },
            },
            // Email Notifications
            {
                planId: proPlanSnap.id,
                featureId: getFeature('email_notifications').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Whatsapp Notifications (additional feature)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('whatsapp_notifications').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Social Media Integration (additional feature)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('social_media_integration').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Marketing Tools (additional feature)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('marketing_tools').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Expense Management (additional feature)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('expense_management').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Client Management (additional feature)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('client_management').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Report Management (additional feature)
            {
                planId: proPlanSnap.id,
                featureId: getFeature('report_management').id,
                isActive: true,
                featureType: 'boolean',
            },
        ]);

        // Premium Plan Features
        await db.insert(planFeatures).values([
            // Studio Shops: Unlimited
            {
                planId: premiumPlan.id,
                featureId: getFeature('studio_shops').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: null, // null means unlimited
                metadata: { unlimited: true },
            },
            // Indoor Billing: Unlimited
            {
                planId: premiumPlan.id,
                featureId: getFeature('indoor_billing').id,
                isActive: true,
                featureType: 'boolean',
                metadata: { unlimited: true },
            },
            // Outdoor Billing: Unlimited
            {
                planId: premiumPlan.id,
                featureId: getFeature('outdoor_billing').id,
                isActive: true,
                featureType: 'boolean',
                metadata: { unlimited: true },
            },
            // Photo Selection Albums: Unlimited
            {
                planId: premiumPlan.id,
                featureId: getFeature('photo_selection_albums').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: null, // null means unlimited
                metadata: { unlimited: true },
            },
            // File Storage: 1TB (1000GB)
            {
                planId: premiumPlan.id,
                featureId: getFeature('file_storage').id,
                isActive: true,
                featureType: 'quota',
                quotaLimit: 1000,
                metadata: { unit: 'GB', description: '1TB storage' },
            },
            // Email Notifications
            {
                planId: premiumPlan.id,
                featureId: getFeature('email_notifications').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Whatsapp Notifications
            {
                planId: premiumPlan.id,
                featureId: getFeature('whatsapp_notifications').id,
                isActive: true,
                featureType: 'boolean',
            },
            // SMS Notifications
            {
                planId: premiumPlan.id,
                featureId: getFeature('sms_notifications').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Social Media Integration
            {
                planId: premiumPlan.id,
                featureId: getFeature('social_media_integration').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Expense Management
            {
                planId: premiumPlan.id,
                featureId: getFeature('expense_management').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Client Management
            {
                planId: premiumPlan.id,
                featureId: getFeature('client_management').id,
                isActive: true,
                featureType: 'boolean',
            },
            // Report Management
            {
                planId: premiumPlan.id,
                featureId: getFeature('report_management').id,
                isActive: true,
                featureType: 'boolean',
            },
            // AI Assistant
            {
                planId: premiumPlan.id,
                featureId: getFeature('ai_assistant').id,
                isActive: true,
                featureType: 'boolean',
            },
            // AI Image Assistant
            {
                planId: premiumPlan.id,
                featureId: getFeature('ai_image_assistant').id,
                isActive: true,
                featureType: 'boolean',
            },
        ]);

        // Create Prices for Snap Flow Plans
        console.log('Creating prices for Snap Flow plans...');
        const [basicPrice, proPriceSnap, premiumPrice] = await db.insert(prices).values([
            {
                id: '660e8400-e29b-41d4-a716-446655440401',
                planId: basicPlan.id,
                priceId: 'price_snap_flow_basic_001',
                value: 99900, // ₹999.00 in paise (lowest tier)
                currency: 'INR',
                isActive: true,
                description: 'Basic plan monthly subscription',
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440402',
                planId: proPlanSnap.id,
                priceId: 'price_snap_flow_pro_001',
                value: 199900, // ₹1999.00 in paise (medium tier)
                currency: 'INR',
                isActive: true,
                description: 'PRO plan monthly subscription',
            },
            {
                id: '660e8400-e29b-41d4-a716-446655440403',
                planId: premiumPlan.id,
                priceId: 'price_snap_flow_premium_001',
                value: 499900, // ₹4999.00 in paise (highest tier)
                currency: 'INR',
                isActive: true,
                description: 'Premium plan monthly subscription',
            },
        ]).returning();

        // Create Recurring Charge Periods
        console.log('Creating recurring charge periods for Snap Flow...');
        await db.insert(recurringChargePeriods).values([
            {
                priceId: basicPrice.id,
                recurringChargePeriodId: 'rcp_snap_flow_basic_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null, // Indefinite
            },
            {
                priceId: proPriceSnap.id,
                recurringChargePeriodId: 'rcp_snap_flow_pro_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null, // Indefinite
            },
            {
                priceId: premiumPrice.id,
                recurringChargePeriodId: 'rcp_snap_flow_premium_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null, // Indefinite
            },
        ]);

        // Create Trial Periods
        console.log('Creating trial periods for Snap Flow...');
        await db.insert(trialPeriods).values([
            {
                planId: basicPlan.id,
                timePeriodId: 'trial_snap_flow_basic_001',
                name: '14-day trial',
                value: 14,
            },
            {
                planId: proPlanSnap.id,
                timePeriodId: 'trial_snap_flow_pro_001',
                name: '14-day trial',
                value: 14,
            },
            {
                planId: premiumPlan.id,
                timePeriodId: 'trial_snap_flow_premium_001',
                name: '30-day trial',
                value: 30,
            },
        ]);

        // Create Renewal Definitions
        console.log('Creating renewal definitions for Snap Flow...');
        await db.insert(renewalDefinitions).values([
            {
                planId: basicPlan.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '7-day grace period',
                gracePeriodValue: 7,
                maxRenewCycles: 0, // Unlimited
            },
            {
                planId: proPlanSnap.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '7-day grace period',
                gracePeriodValue: 7,
                maxRenewCycles: 0, // Unlimited
            },
            {
                planId: premiumPlan.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '14-day grace period',
                gracePeriodValue: 14,
                maxRenewCycles: 0, // Unlimited
            },
        ]);

        console.log('✅ Snap Flow seed data created successfully!');

        console.log('✅ Database seed completed successfully!');
        console.log('\nSummary:');
        console.log(`- Created ${2} tenants`);
        console.log(`- Created ${4} accounts (including 1 parent-child relationship)`);
        console.log(`- Created ${4} products (3 original + 1 Snap Flow)`);
        console.log(`- Created ${28} features (13 original with all charge models + 15 Snap Flow)`);
        console.log(`- Created ${3} plan families (Snap Flow: Basic, PRO, Premium - each for versioning)`);
        console.log(`- Created ${6} plans (3 original: BASIC, PRO, PREMIUM + 3 Snap Flow v1: Basic, PRO, Premium)`);
        console.log(`- Created ${14} plan-product associations (5 original + 3 Snap Flow + 6 pricing models)`);
        console.log(`- Created ${6} prices (3 original + 3 Snap Flow)`);
        console.log(`- Created ${6} recurring charge periods (3 original + 3 Snap Flow)`);
        console.log(`- Created ${6} trial periods (3 original + 3 Snap Flow)`);
        console.log(`- Created ${6} renewal definitions (3 original + 3 Snap Flow)`);
        console.log(`- Created ${15} pricing models (5 per plan: per_user, per_usage, tiered, volume, graduated)`);
        console.log(`- Created ${3} subscriptions (2 active, 1 trial)`);
        console.log(`- Created ${3} payments (2 completed, 1 pending)`);
        console.log(`- Created ${4} payment transactions`);
        console.log(`- Created ${4} usage events`);


    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await client.end();
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log('🎉 Seed process finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Seed process failed:', error);
        process.exit(1);
    });
