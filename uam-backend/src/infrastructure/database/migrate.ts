import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/SaasDB';

    // If DATABASE_URL uses 'postgres' as hostname (Docker service name), 
    // try localhost instead when running from local machine
    if (connectionString.includes('@postgres:')) {
        console.log('⚠️  Detected Docker hostname "postgres" - trying localhost instead for local execution...');
        connectionString = connectionString.replace('@postgres:', '@localhost:');
    }

    console.log('🔄 Running migrations...');
    console.log(`   Connection: ${connectionString.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs

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
