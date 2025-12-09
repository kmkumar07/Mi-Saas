import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';
import { AuthProvider, AccountType } from '../../../domain/enums';

/**
 * User Repository Implementation
 * Implements IUserRepository using Drizzle ORM
 */
@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<User | null> {
        const result = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByEmail(email: string, tenantId: string): Promise<User | null> {
        const result = await this.db
            .select()
            .from(schema.users)
            .where(
                and(
                    eq(schema.users.email, email),
                    eq(schema.users.tenantId, tenantId)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByTenantId(tenantId: string): Promise<User[]> {
        const results = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.tenantId, tenantId));

        return results.map(row => this.toDomain(row));
    }

    async create(user: User): Promise<User> {
        const persistence = user.toPersistence();

        const result = await this.db
            .insert(schema.users)
            .values({
                id: persistence.id,
                tenantId: persistence.tenantId,
                email: persistence.email,
                passwordHash: persistence.passwordHash,
                authProvider: persistence.authProvider as any,
                externalId: persistence.externalId,
                firstName: persistence.firstName,
                lastName: persistence.lastName,
                isActive: persistence.isActive,
                isEmailVerified: persistence.isEmailVerified,
                accountType: persistence.accountType as any,
                organizationId: persistence.organizationId,
                isCompanyOwner: persistence.isCompanyOwner,
                isSyncedFromAd: persistence.isSyncedFromAd,
                lastSyncedAt: persistence.lastSyncedAt,
                emailDomain: persistence.emailDomain,
                lastLoginAt: persistence.lastLoginAt,
                createdAt: persistence.createdAt,
                updatedAt: persistence.updatedAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async update(user: User): Promise<User> {
        const persistence = user.toPersistence();

        const result = await this.db
            .update(schema.users)
            .set({
                email: persistence.email,
                passwordHash: persistence.passwordHash,
                firstName: persistence.firstName,
                lastName: persistence.lastName,
                isActive: persistence.isActive,
                isEmailVerified: persistence.isEmailVerified,
                lastLoginAt: persistence.lastLoginAt,
                updatedAt: new Date(),
            })
            .where(eq(schema.users.id, persistence.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.users)
            .where(eq(schema.users.id, id));
    }

    async existsByEmail(email: string, tenantId: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(
                and(
                    eq(schema.users.email, email),
                    eq(schema.users.tenantId, tenantId)
                )
            )
            .limit(1);

        return result.length > 0;
    }

    private toDomain(row: typeof schema.users.$inferSelect): User {
        return User.fromPersistence({
            id: row.id,
            tenantId: row.tenantId,
            email: row.email,
            passwordHash: row.passwordHash,
            authProvider: row.authProvider as AuthProvider,
            externalId: row.externalId,
            firstName: row.firstName,
            lastName: row.lastName,
            isActive: row.isActive,
            isEmailVerified: row.isEmailVerified,
            accountType: row.accountType as AccountType,
            organizationId: row.organizationId,
            isCompanyOwner: row.isCompanyOwner,
            isSyncedFromAd: row.isSyncedFromAd,
            lastSyncedAt: row.lastSyncedAt,
            emailDomain: row.emailDomain,
            lastLoginAt: row.lastLoginAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
