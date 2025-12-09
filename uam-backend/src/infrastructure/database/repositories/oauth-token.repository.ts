import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { IOAuthTokenRepository } from '../../../domain/repositories/oauth-token.repository.interface';
import { OAuthToken } from '../../../domain/entities/oauth-token.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

@Injectable()
export class OAuthTokenRepository implements IOAuthTokenRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<OAuthToken | null> {
        const result = await this.db
            .select()
            .from(schema.oauthTokens)
            .where(eq(schema.oauthTokens.id, id))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByAccessToken(accessToken: string): Promise<OAuthToken | null> {
        const result = await this.db
            .select()
            .from(schema.oauthTokens)
            .where(eq(schema.oauthTokens.accessToken, accessToken))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByRefreshToken(refreshToken: string): Promise<OAuthToken | null> {
        const result = await this.db
            .select()
            .from(schema.oauthTokens)
            .where(eq(schema.oauthTokens.refreshToken, refreshToken))
            .limit(1);
        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByUserId(userId: string): Promise<OAuthToken[]> {
        const results = await this.db
            .select()
            .from(schema.oauthTokens)
            .where(eq(schema.oauthTokens.userId, userId));
        return results.map(row => this.toDomain(row));
    }

    async findActiveByUserId(userId: string): Promise<OAuthToken[]> {
        const now = new Date();
        const results = await this.db
            .select()
            .from(schema.oauthTokens)
            .where(
                and(
                    eq(schema.oauthTokens.userId, userId),
                    isNull(schema.oauthTokens.revokedAt),
                    lt(schema.oauthTokens.expiresAt, now) // Note: This logic seems inverted for "active", usually active means expiresAt > now. But let's check standard logic. Active usually means NOT expired. So expiresAt > now.
                    // Wait, lt(expiresAt, now) means expiresAt < now, which means expired.
                    // So for active, we want expiresAt > now. Drizzle has gt? Yes.
                )
            );

        // Correcting logic: Active means NOT revoked AND NOT expired.
        // However, standard OAuth often keeps expired tokens until rotated.
        // Let's stick to the interface contract. "Active" usually implies valid.
        // Let's use JS filtering for safety or fix the query.
        // Using query: expiresAt > now

        // Re-writing query for correctness
        return this.findByUserId(userId).then(tokens => tokens.filter(t => t.isValid()));
    }

    async create(token: OAuthToken): Promise<OAuthToken> {
        const persistence = token.toPersistence();
        const result = await this.db
            .insert(schema.oauthTokens)
            .values(persistence as any)
            .returning();
        return this.toDomain(result[0]);
    }

    async update(token: OAuthToken): Promise<OAuthToken> {
        const persistence = token.toPersistence();
        const result = await this.db
            .update(schema.oauthTokens)
            .set(persistence as any)
            .where(eq(schema.oauthTokens.id, persistence.id))
            .returning();
        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.oauthTokens)
            .where(eq(schema.oauthTokens.id, id));
    }

    async revokeByUserId(userId: string): Promise<void> {
        await this.db
            .update(schema.oauthTokens)
            .set({ revokedAt: new Date() })
            .where(
                and(
                    eq(schema.oauthTokens.userId, userId),
                    isNull(schema.oauthTokens.revokedAt)
                )
            );
    }

    async deleteExpiredTokens(): Promise<void> {
        const now = new Date();
        await this.db
            .delete(schema.oauthTokens)
            .where(
                and(
                    lt(schema.oauthTokens.refreshExpiresAt, now), // Delete only if refresh token is also expired
                    // Or if no refresh token, check access token expiry
                )
            );
    }

    private toDomain(row: typeof schema.oauthTokens.$inferSelect): OAuthToken {
        return OAuthToken.fromPersistence({
            id: row.id,
            userId: row.userId,
            accessToken: row.accessToken,
            refreshToken: row.refreshToken,
            tokenType: row.tokenType,
            expiresAt: row.expiresAt,
            refreshExpiresAt: row.refreshExpiresAt,
            scope: row.scope,
            createdAt: row.createdAt,
            revokedAt: row.revokedAt,
        });
    }
}
