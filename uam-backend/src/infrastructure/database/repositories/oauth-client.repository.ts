import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { IOAuthClientRepository } from '../../../domain/repositories/oauth-client.repository.interface';
import { OAuthClient } from '../../../domain/entities/oauth-client.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * OAuth2 Client Repository Implementation
 * Implements IOAuthClientRepository using Drizzle ORM
 */
@Injectable()
export class OAuthClientRepository implements IOAuthClientRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<OAuthClient | null> {
        const result = await this.db
            .select()
            .from(schema.oauthClients)
            .where(eq(schema.oauthClients.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByClientId(clientId: string): Promise<OAuthClient | null> {
        const result = await this.db
            .select()
            .from(schema.oauthClients)
            .where(eq(schema.oauthClients.clientId, clientId))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByTenantId(tenantId: string): Promise<OAuthClient[]> {
        const results = await this.db
            .select()
            .from(schema.oauthClients)
            .where(eq(schema.oauthClients.tenantId, tenantId));

        return results.map(row => this.toDomain(row));
    }

    async create(client: OAuthClient): Promise<OAuthClient> {
        const persistence = client.toPersistence();

        const result = await this.db
            .insert(schema.oauthClients)
            .values({
                id: persistence.id,
                clientId: persistence.clientId,
                clientSecretHash: persistence.clientSecretHash,
                name: persistence.name,
                redirectUris: persistence.redirectUris,
                scopes: persistence.scopes,
                grantTypes: persistence.grantTypes,
                tenantId: persistence.tenantId,
                isActive: persistence.isActive,
                createdAt: persistence.createdAt,
                updatedAt: persistence.updatedAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async update(client: OAuthClient): Promise<OAuthClient> {
        const persistence = client.toPersistence();

        const result = await this.db
            .update(schema.oauthClients)
            .set({
                name: persistence.name,
                redirectUris: persistence.redirectUris,
                scopes: persistence.scopes,
                grantTypes: persistence.grantTypes,
                isActive: persistence.isActive,
                updatedAt: new Date(),
            })
            .where(eq(schema.oauthClients.id, persistence.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.oauthClients)
            .where(eq(schema.oauthClients.id, id));
    }

    async existsByClientId(clientId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.oauthClients.id })
            .from(schema.oauthClients)
            .where(eq(schema.oauthClients.clientId, clientId))
            .limit(1);

        return result.length > 0;
    }

    private toDomain(row: typeof schema.oauthClients.$inferSelect): OAuthClient {
        return OAuthClient.fromPersistence({
            id: row.id,
            clientId: row.clientId,
            clientSecretHash: row.clientSecretHash,
            name: row.name,
            redirectUris: row.redirectUris || [],
            scopes: row.scopes || [],
            grantTypes: row.grantTypes || [],
            tenantId: row.tenantId,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

