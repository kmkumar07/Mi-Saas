import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { IIdentityRepository } from '../../../domain/repositories/identity.repository.interface';
import { Identity } from '../../../domain/entities/identity.entity';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.provider';

/**
 * Identity Repository Implementation
 * Implements IIdentityRepository using Drizzle ORM
 * 
 * CRITICAL: Identity alone does NOT grant access. All access requires organization_membership.
 */
@Injectable()
export class IdentityRepository implements IIdentityRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async findById(id: string): Promise<Identity | null> {
        const result = await this.db
            .select()
            .from(schema.identities)
            .where(eq(schema.identities.id, id))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async findByEmail(email: string): Promise<Identity | null> {
        const result = await this.db
            .select()
            .from(schema.identities)
            .where(eq(schema.identities.email, email))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.toDomain(result[0]);
    }

    async create(identity: Identity): Promise<Identity> {
        const persistence = identity.toPersistence();

        const result = await this.db
            .insert(schema.identities)
            .values({
                id: persistence.id,
                email: persistence.email,
                firstName: persistence.firstName,
                lastName: persistence.lastName,
                createdAt: persistence.createdAt,
                updatedAt: persistence.updatedAt,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async update(identity: Identity): Promise<Identity> {
        const persistence = identity.toPersistence();

        const result = await this.db
            .update(schema.identities)
            .set({
                email: persistence.email,
                firstName: persistence.firstName,
                lastName: persistence.lastName,
                updatedAt: new Date(),
            })
            .where(eq(schema.identities.id, persistence.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(schema.identities)
            .where(eq(schema.identities.id, id));
    }

    async existsByEmail(email: string): Promise<boolean> {
        const result = await this.db
            .select({ id: schema.identities.id })
            .from(schema.identities)
            .where(eq(schema.identities.email, email))
            .limit(1);

        return result.length > 0;
    }

    private toDomain(row: typeof schema.identities.$inferSelect): Identity {
        return Identity.fromPersistence({
            id: row.id,
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

