import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, lt } from 'drizzle-orm';
import { IOAuthAuthorizationCodeRepository } from '../../../domain/repositories/oauth-authorization-code.repository.interface';
import { OAuthAuthorizationCode } from '../../../domain/entities/oauth-authorization-code.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * OAuth2 Authorization Code Repository Implementation
 * Implements IOAuthAuthorizationCodeRepository using Drizzle ORM
 */
@Injectable()
export class OAuthAuthorizationCodeRepository implements IOAuthAuthorizationCodeRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<OAuthAuthorizationCode | null> {
        const result = await this.db
            .select()
            .from(schema.oauthAuthorizationCodes)
            .where(eq(schema.oauthAuthorizationCodes.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByCode(code: string): Promise<OAuthAuthorizationCode | null> {
        const result = await this.db
            .select()
            .from(schema.oauthAuthorizationCodes)
            .where(eq(schema.oauthAuthorizationCodes.code, code))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByClientId(clientId: string): Promise<OAuthAuthorizationCode[]> {
        const results = await this.db
            .select()
            .from(schema.oauthAuthorizationCodes)
            .where(eq(schema.oauthAuthorizationCodes.clientId, clientId));

        return results.map(row => this.toDomain(row));
    }

    async findByOrganizationMemberId(organizationMemberId: string): Promise<OAuthAuthorizationCode[]> {
        const results = await this.db
            .select()
            .from(schema.oauthAuthorizationCodes)
            .where(eq(schema.oauthAuthorizationCodes.organizationMemberId, organizationMemberId));

        return results.map(row => this.toDomain(row));
    }

    async create(code: OAuthAuthorizationCode): Promise<OAuthAuthorizationCode> {
        const persistence = code.toPersistence();

        const result = await this.db
            .insert(schema.oauthAuthorizationCodes)
            .values({
                id: persistence.id,
                code: persistence.code,
                clientId: persistence.clientId,
                organizationMemberId: persistence.organizationMemberId,
                redirectUri: persistence.redirectUri,
                scopes: persistence.scopes,
                expiresAt: persistence.expiresAt,
                createdAt: persistence.createdAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.oauthAuthorizationCodes)
            .where(eq(schema.oauthAuthorizationCodes.id, id));
    }

    async deleteByCode(code: string): Promise<void> {
        await this.db
            .delete(schema.oauthAuthorizationCodes)
            .where(eq(schema.oauthAuthorizationCodes.code, code));
    }

    async deleteExpiredCodes(): Promise<void> {
        const now = new Date();
        await this.db
            .delete(schema.oauthAuthorizationCodes)
            .where(lt(schema.oauthAuthorizationCodes.expiresAt, now));
    }

    private toDomain(row: typeof schema.oauthAuthorizationCodes.$inferSelect): OAuthAuthorizationCode {
        return OAuthAuthorizationCode.fromPersistence({
            id: row.id,
            code: row.code,
            clientId: row.clientId,
            organizationMemberId: row.organizationMemberId,
            redirectUri: row.redirectUri,
            scopes: row.scopes || [],
            expiresAt: row.expiresAt,
            createdAt: row.createdAt,
        });
    }
}

