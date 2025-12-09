import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Use require for postgres due to CommonJS/ESM interop issues
const postgres = require('postgres');

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export const databaseProviders = [
    {
        provide: DATABASE_CONNECTION,
        useFactory: async (): Promise<PostgresJsDatabase<typeof schema>> => {
            const connectionString = process.env.DATABASE_URL;

            if (!connectionString) {
                throw new Error('DATABASE_URL environment variable is not set');
            }

            // Create postgres client with proper configuration
            const client = postgres(connectionString, {
                max: 10,
                idle_timeout: 20,
                connect_timeout: 10,
            });

            const db = drizzle(client, { schema });

            return db;
        },
    },
];
