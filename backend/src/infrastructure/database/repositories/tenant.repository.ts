import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { Tenant } from '@domain/entities';
import { ITenantRepository } from '@domain/repositories';
import * as schema from '../schema';
import { DATABASE_CONNECTION } from '../database.module';

@Injectable()
export class TenantRepository implements ITenantRepository {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) { }

    async create(tenant: Tenant): Promise<Tenant> {
        const result = await this.db
            .insert(schema.tenants)
            .values({
                name: tenant.name,
                emailDomain: tenant.emailDomain,
                metadata: tenant.metadata,
            })
            .returning();

        return this.toDomain(result[0]);
    }

    async findById(id: string): Promise<Tenant | null> {
        const result = await this.db
            .select()
            .from(schema.tenants)
            .where(eq(schema.tenants.id, id))
            .limit(1);

        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findByEmailDomain(emailDomain: string): Promise<Tenant | null> {
        const result = await this.db
            .select()
            .from(schema.tenants)
            .where(eq(schema.tenants.emailDomain, emailDomain))
            .limit(1);

        return result.length > 0 ? this.toDomain(result[0]) : null;
    }

    async findAll(): Promise<Tenant[]> {
        const results = await this.db.select().from(schema.tenants);
        return results.map((row) => this.toDomain(row));
    }

    async update(tenant: Tenant): Promise<Tenant> {
        if (!tenant.id) {
            throw new Error('Cannot update tenant without ID');
        }

        const result = await this.db
            .update(schema.tenants)
            .set({
                name: tenant.name,
                emailDomain: tenant.emailDomain,
                metadata: tenant.metadata,
            })
            .where(eq(schema.tenants.id, tenant.id))
            .returning();

        return this.toDomain(result[0]);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(schema.tenants).where(eq(schema.tenants.id, id));
    }

    private toDomain(row: schema.Tenant): Tenant {
        return new Tenant({
            id: row.id,
            name: row.name,
            emailDomain: row.emailDomain ?? undefined,
            metadata: row.metadata as Record<string, any>,
            createdAt: row.createdAt,
        });
    }
}
