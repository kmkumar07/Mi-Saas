import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/SaasDB';

    console.log('🔄 Running migrations...');

    // Create connection for migrations
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);

    try {
        await migrate(db, {
            migrationsFolder: './src/infrastructure/database/migrations',
        });

        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
};

runMigration();
