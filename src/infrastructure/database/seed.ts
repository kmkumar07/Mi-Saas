import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
    tenants,
    products,
    features,
    plans,
    planProducts,
    prices,
    recurringChargePeriods,
    renewalDefinitions,
    trialPeriods,
} from './schema';

async function seed() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ag_saas';
    console.log(connectionString);
    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log('🌱 Starting database seed...');

    try {
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
                tenantId: tenant1.id,
                name: 'API Access',
                description: 'Core API access with rate limiting',
                apiKey: 'api_key_product_1',
                active: true,
                metadata: { category: 'Core' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440012',
                tenantId: tenant1.id,
                name: 'Analytics Dashboard',
                description: 'Advanced analytics and reporting features',
                apiKey: 'api_key_product_2',
                active: true,
                metadata: { category: 'Analytics' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440013',
                tenantId: tenant1.id,
                name: 'Premium Support',
                description: '24/7 priority support with dedicated account manager',
                apiKey: 'api_key_product_3',
                active: true,
                metadata: { category: 'Support' },
            },
        ]).returning();

        // 3. Create Features
        console.log('Creating features...');
        await db.insert(features).values([
            // Features for API Access Product
            {
                id: '550e8400-e29b-41d4-a716-446655440021',
                productId: product1.id,
                name: 'API Rate Limit',
                code: 'api_rate_limit',
                description: 'Number of API calls allowed per month',
                featureType: 'metered',
                chargeModel: 'per_api_call',
                serviceUrl: 'https://api.example.com/meter/api_calls',
                metadata: { unit: 'calls' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440022',
                productId: product1.id,
                name: 'Webhook Support',
                code: 'webhook_support',
                description: 'Enable webhook notifications',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440023',
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
                id: '550e8400-e29b-41d4-a716-446655440024',
                productId: product2.id,
                name: 'Custom Reports',
                code: 'custom_reports',
                description: 'Create custom analytics reports',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { enabled: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440025',
                productId: product2.id,
                name: 'Data Retention',
                code: 'data_retention_days',
                description: 'Number of days to retain analytics data',
                featureType: 'quota',
                chargeModel: 'flat',
                metadata: { days: 90 },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440026',
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
                id: '550e8400-e29b-41d4-a716-446655440027',
                productId: product3.id,
                name: 'Priority Support',
                code: 'priority_support',
                description: '24/7 priority support access',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { sla: '1 hour response time' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440028',
                productId: product3.id,
                name: 'Dedicated Account Manager',
                code: 'dedicated_account_manager',
                description: 'Assigned dedicated account manager',
                featureType: 'boolean',
                chargeModel: 'flat',
                metadata: { included: true },
            },
        ]);

        // 4. Create Plans
        console.log('Creating plans...');
        const [freePlan, standardPlan, proPlan, enterprisePlan] = await db.insert(plans).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440031',
                tenantId: tenant1.id,
                name: 'Free Plan',
                planType: 'free',
                active: true,
                metadata: { description: 'Perfect for getting started' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440032',
                tenantId: tenant1.id,
                name: 'Standard Plan',
                planType: 'standard',
                active: true,
                metadata: { description: 'For growing businesses', popular: true },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440033',
                tenantId: tenant1.id,
                name: 'Pro Plan',
                planType: 'pro',
                active: true,
                metadata: { description: 'For professional teams' },
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440034',
                tenantId: tenant1.id,
                name: 'Enterprise Plan',
                planType: 'enterprise',
                active: true,
                metadata: { description: 'For large organizations', customPricing: true },
            },
        ]).returning();

        // 5. Create Plan-Product Associations
        console.log('Creating plan-product associations...');
        await db.insert(planProducts).values([
            // Free Plan - Only API Access
            { planId: freePlan.id, productId: product1.id },
            // Standard Plan - API Access + Analytics
            { planId: standardPlan.id, productId: product1.id },
            { planId: standardPlan.id, productId: product2.id },
            // Pro Plan - API Access + Analytics
            { planId: proPlan.id, productId: product1.id },
            { planId: proPlan.id, productId: product2.id },
            // Enterprise Plan - All Products
            { planId: enterprisePlan.id, productId: product1.id },
            { planId: enterprisePlan.id, productId: product2.id },
            { planId: enterprisePlan.id, productId: product3.id },
        ]);

        // 6. Create Prices
        console.log('Creating prices...');
        const [freePrice, standardPrice, proPrice, enterprisePrice] = await db.insert(prices).values([
            {
                id: '550e8400-e29b-41d4-a716-446655440041',
                planId: freePlan.id,
                priceId: 'price_free_001',
                value: 0,
                currency: 'USD',
                isActive: true,
                description: 'Free forever',
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440042',
                planId: standardPlan.id,
                priceId: 'price_standard_001',
                value: 2900, // $29.00
                currency: 'USD',
                isActive: true,
                description: 'Standard monthly subscription',
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440043',
                planId: proPlan.id,
                priceId: 'price_pro_001',
                value: 9900, // $99.00
                currency: 'USD',
                isActive: true,
                description: 'Pro monthly subscription',
            },
            {
                id: '550e8400-e29b-41d4-a716-446655440044',
                planId: enterprisePlan.id,
                priceId: 'price_enterprise_001',
                value: 29900, // $299.00
                currency: 'USD',
                isActive: true,
                description: 'Enterprise monthly subscription',
            },
        ]).returning();

        // 7. Create Recurring Charge Periods
        console.log('Creating recurring charge periods...');
        await db.insert(recurringChargePeriods).values([
            {
                priceId: freePrice.id,
                recurringChargePeriodId: 'rcp_free_001',
                chargeFrequency: 'one-time',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null,
            },
            {
                priceId: standardPrice.id,
                recurringChargePeriodId: 'rcp_standard_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null, // Indefinite
            },
            {
                priceId: proPrice.id,
                recurringChargePeriodId: 'rcp_pro_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: null,
            },
            {
                priceId: enterprisePrice.id,
                recurringChargePeriodId: 'rcp_enterprise_001',
                chargeFrequency: 'monthly',
                startDateTime: new Date('2024-01-01'),
                numberOfPeriods: 12, // Annual contract
            },
        ]);

        // 8. Create Trial Periods (for paid plans)
        console.log('Creating trial periods...');
        await db.insert(trialPeriods).values([
            {
                planId: standardPlan.id,
                timePeriodId: 'trial_standard_001',
                name: '14-day trial',
                value: 14,
            },
            {
                planId: proPlan.id,
                timePeriodId: 'trial_pro_001',
                name: '14-day trial',
                value: 14,
            },
            {
                planId: enterprisePlan.id,
                timePeriodId: 'trial_enterprise_001',
                name: '30-day trial',
                value: 30,
            },
        ]);

        // 9. Create Renewal Definitions (for paid plans)
        console.log('Creating renewal definitions...');
        await db.insert(renewalDefinitions).values([
            {
                planId: standardPlan.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '7-day grace period',
                gracePeriodValue: 7,
                maxRenewCycles: 0, // Unlimited
            },
            {
                planId: proPlan.id,
                isExpirable: true,
                isAutomaticRenewable: true,
                renewCycleUnits: 'months',
                gracePeriodName: '7-day grace period',
                gracePeriodValue: 7,
                maxRenewCycles: 0,
            },
            {
                planId: enterprisePlan.id,
                isExpirable: true,
                isAutomaticRenewable: false, // Manual renewal for enterprise
                renewCycleUnits: 'years',
                gracePeriodName: '30-day grace period',
                gracePeriodValue: 30,
                maxRenewCycles: 5, // 5-year maximum contract
            },
        ]);

        console.log('✅ Database seed completed successfully!');
        console.log('\nSummary:');
        console.log(`- Created ${2} tenants`);
        console.log(`- Created ${3} products`);
        console.log(`- Created ${8} features`);
        console.log(`- Created ${4} plans (Free, Standard, Pro, Enterprise)`);
        console.log(`- Created ${8} plan-product associations`);
        console.log(`- Created ${4} prices`);
        console.log(`- Created ${4} recurring charge periods`);
        console.log(`- Created ${3} trial periods`);
        console.log(`- Created ${3} renewal definitions`);

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
