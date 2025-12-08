import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
    tenants,
    accounts,
    products,
    features,
    plans,
    planProducts,
    planFeatures,
    planFamilies,
    prices,
    recurringChargePeriods,
    renewalDefinitions,
    trialPeriods,
    subscriptions,
    payments,
    paymentTransactions,
    paymentOrders,
    webhookEvents,
    usageEvents,
} from './schema';

async function clean() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ag_saas';
    console.log('Cleaning database...');
    const client = postgres(connectionString);
    const db = drizzle(client);

    try {
        // Delete in reverse order of dependencies
        await db.delete(usageEvents);
        await db.delete(webhookEvents);
        await db.delete(paymentTransactions);
        await db.delete(paymentOrders);
        await db.delete(payments);
        await db.delete(subscriptions);
        await db.delete(trialPeriods);
        await db.delete(renewalDefinitions);
        await db.delete(recurringChargePeriods);
        await db.delete(prices);
        await db.delete(planFeatures);
        await db.delete(planProducts);
        await db.delete(plans);
        await db.delete(planFamilies);
        await db.delete(features);
        await db.delete(products);
        await db.delete(accounts);
        await db.delete(tenants);
        console.log('✓ Database cleaned');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await client.end();
    }
}

clean();
