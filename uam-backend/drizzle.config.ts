import type { Config } from 'drizzle-kit';

export default {
    schema: './src/infrastructure/database/schema.ts',
    out: './src/infrastructure/database/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/SaasDB',
    },
} satisfies Config;
