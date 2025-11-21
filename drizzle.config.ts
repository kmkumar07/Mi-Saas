import type { Config } from 'drizzle-kit';

export default {
    schema: './src/infrastructure/database/schema.ts',
    out: './drizzle/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ag_saas',
    },
} satisfies Config;
