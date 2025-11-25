import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
    tenants,
    accounts,
    products,
    features,
    plans,
    planProducts,
    prices,
    recurringChargePeriods,
    renewalDefinitions,
    trialPeriods,
    subscriptions,
    payments,
    paymentTransactions,
    usageEvents,
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
        await db.delete(planProducts);
        await db.delete(plans);
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
                planId: standardPlan.id,
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
                planId: proPlan.id,
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
                planId: standardPlan.id,
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
                description: 'Standard Plan - Monthly subscription',
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
                description: 'Pro Plan - Monthly subscription',
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
                description: 'Standard Plan - Trial conversion payment',
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

        console.log('✅ Database seed completed successfully!');
        console.log('\nSummary:');
        console.log(`- Created ${2} tenants`);
        console.log(`- Created ${4} accounts (including 1 parent-child relationship)`);
        console.log(`- Created ${3} products`);
        console.log(`- Created ${8} features`);
        console.log(`- Created ${4} plans (Free, Standard, Pro, Enterprise)`);
        console.log(`- Created ${8} plan-product associations`);
        console.log(`- Created ${4} prices`);
        console.log(`- Created ${4} recurring charge periods`);
        console.log(`- Created ${3} trial periods`);
        console.log(`- Created ${3} renewal definitions`);
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
