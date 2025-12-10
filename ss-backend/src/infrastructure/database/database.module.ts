import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
    providers: [
        {
            provide: DATABASE_CONNECTION,
            inject: [ConfigService],
            useFactory: async (
                configService: ConfigService,
            ): Promise<PostgresJsDatabase<typeof schema>> => {
                const connectionString = configService.get<string>('DATABASE_URL');

                if (!connectionString) {
                    throw new Error('DATABASE_URL is not defined');
                }

                const client = postgres(connectionString);
                return drizzle(client, { schema });
            },
        },
    ],
    exports: [DATABASE_CONNECTION],
})
export class DatabaseModule { }
