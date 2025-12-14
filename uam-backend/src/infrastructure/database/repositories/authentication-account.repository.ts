import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IAuthenticationAccountRepository } from '../../../domain/repositories/authentication-account.repository.interface';
import { AuthenticationAccount } from '../../../domain/entities/authentication-account.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * Authentication Account Repository Implementation
 * Implements IAuthenticationAccountRepository using Drizzle ORM
 * 
 * CRITICAL: Authentication accounts are for login only. They do NOT grant access.
 * Access requires: auth_account → identity → organization_members → authorization layers
 */
@Injectable()
export class AuthenticationAccountRepository implements IAuthenticationAccountRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<AuthenticationAccount | null> {
        const result = await this.db
            .select()
            .from(schema.authenticationAccounts)
            .where(eq(schema.authenticationAccounts.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByIdentityId(identityId: string): Promise<AuthenticationAccount[]> {
        const results = await this.db
            .select()
            .from(schema.authenticationAccounts)
            .where(eq(schema.authenticationAccounts.identityId, identityId));

        return results.map(row => this.toDomain(row));
    }

    async findByEmail(email: string): Promise<AuthenticationAccount | null> {
        const result = await this.db
            .select()
            .from(schema.authenticationAccounts)
            .where(eq(schema.authenticationAccounts.email, email))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByProviderAndAccountId(provider: string, providerAccountId: string): Promise<AuthenticationAccount | null> {
        const result = await this.db
            .select()
            .from(schema.authenticationAccounts)
            .where(
                and(
                    eq(schema.authenticationAccounts.provider, provider as any),
                    eq(schema.authenticationAccounts.providerAccountId, providerAccountId)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByIdentityIdAndProvider(identityId: string, provider: string): Promise<AuthenticationAccount | null> {
        const result = await this.db
            .select()
            .from(schema.authenticationAccounts)
            .where(
                and(
                    eq(schema.authenticationAccounts.identityId, identityId),
                    eq(schema.authenticationAccounts.provider, provider as any)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async create(account: AuthenticationAccount): Promise<AuthenticationAccount> {
        const persistence = account.toPersistence();

        const result = await this.db
            .insert(schema.authenticationAccounts)
            .values({
                id: persistence.id,
                identityId: persistence.identityId,
                provider: persistence.provider as any,
                providerAccountId: persistence.providerAccountId,
                email: persistence.email,
                passwordHash: persistence.passwordHash,
                externalId: persistence.externalId,
                isActive: persistence.isActive,
                isEmailVerified: persistence.isEmailVerified,
                lastLoginAt: persistence.lastLoginAt,
                createdAt: persistence.createdAt,
                updatedAt: persistence.updatedAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async update(account: AuthenticationAccount): Promise<AuthenticationAccount> {
        const persistence = account.toPersistence();

        const result = await this.db
            .update(schema.authenticationAccounts)
            .set({
                email: persistence.email,
                passwordHash: persistence.passwordHash,
                externalId: persistence.externalId,
                isActive: persistence.isActive,
                isEmailVerified: persistence.isEmailVerified,
                lastLoginAt: persistence.lastLoginAt,
                updatedAt: new Date(),
            })
            .where(eq(schema.authenticationAccounts.id, persistence.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.authenticationAccounts)
            .where(eq(schema.authenticationAccounts.id, id));
    }

    async existsByIdentityIdAndProvider(identityId: string, provider: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.authenticationAccounts.id })
            .from(schema.authenticationAccounts)
            .where(
                and(
                    eq(schema.authenticationAccounts.identityId, identityId),
                    eq(schema.authenticationAccounts.provider, provider as any)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    private toDomain(row: typeof schema.authenticationAccounts.$inferSelect): AuthenticationAccount {
        return AuthenticationAccount.fromPersistence({
            id: row.id,
            identityId: row.identityId,
            provider: row.provider as any,
            providerAccountId: row.providerAccountId,
            email: row.email,
            passwordHash: row.passwordHash,
            externalId: row.externalId,
            isActive: row.isActive,
            isEmailVerified: row.isEmailVerified,
            lastLoginAt: row.lastLoginAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

