import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Account } from '../../../domain/entities/account.entity';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { accounts } from '../schema';

@Injectable()
export class AccountRepository implements IAccountRepository {
    private db: ReturnType<typeof drizzle>;

    constructor() {
        const connectionString = process.env.DATABASE_URL || '';
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async create(account: Account): Promise<Account> {
        const [result] = await this.db.insert(accounts).values({
            id: account.id,
            tenantId: account.tenantId,
            parentAccountId: account.parentAccountId,
            companyName: account.companyName,
            legalName: account.legalName,
            taxId: account.taxId,
            billingEmail: account.billingEmail,
            billingAddressLine1: account.billingAddressLine1,
            billingAddressLine2: account.billingAddressLine2,
            billingCity: account.billingCity,
            billingState: account.billingState,
            billingPostalCode: account.billingPostalCode,
            billingCountry: account.billingCountry,
            paymentMethod: account.paymentMethod,
            paymentGatewayCustomerId: account.paymentGatewayCustomerId,
            accountStatus: account.accountStatus,
            creditLimit: account.creditLimit,
            currentBalance: account.currentBalance,
            metadata: account.metadata,
        }).returning();

        return this.toDomain(result);
    }

    async findById(id: string): Promise<Account | null> {
        const [result] = await this.db
            .select()
            .from(accounts)
            .where(eq(accounts.id, id));

        return result ? this.toDomain(result) : null;
    }

    async findByTenantId(tenantId: string): Promise<Account[]> {
        const results = await this.db
            .select()
            .from(accounts)
            .where(eq(accounts.tenantId, tenantId));

        return results.map(r => this.toDomain(r));
    }

    async findChildAccounts(parentAccountId: string): Promise<Account[]> {
        const results = await this.db
            .select()
            .from(accounts)
            .where(eq(accounts.parentAccountId, parentAccountId));

        return results.map(r => this.toDomain(r));
    }

    async update(account: Account): Promise<Account> {
        const [result] = await this.db
            .update(accounts)
            .set({
                companyName: account.companyName,
                legalName: account.legalName,
                taxId: account.taxId,
                billingEmail: account.billingEmail,
                billingAddressLine1: account.billingAddressLine1,
                billingAddressLine2: account.billingAddressLine2,
                billingCity: account.billingCity,
                billingState: account.billingState,
                billingPostalCode: account.billingPostalCode,
                billingCountry: account.billingCountry,
                paymentMethod: account.paymentMethod,
                paymentGatewayCustomerId: account.paymentGatewayCustomerId,
                accountStatus: account.accountStatus,
                creditLimit: account.creditLimit,
                currentBalance: account.currentBalance,
                metadata: account.metadata,
                updatedAt: new Date(),
            })
            .where(eq(accounts.id, account.id))
            .returning();

        return this.toDomain(result);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(accounts).where(eq(accounts.id, id));
    }

    private toDomain(data: any): Account {
        return new Account({
            id: data.id,
            tenantId: data.tenantId,
            parentAccountId: data.parentAccountId,
            companyName: data.companyName,
            legalName: data.legalName,
            taxId: data.taxId,
            billingEmail: data.billingEmail,
            billingAddressLine1: data.billingAddressLine1,
            billingAddressLine2: data.billingAddressLine2,
            billingCity: data.billingCity,
            billingState: data.billingState,
            billingPostalCode: data.billingPostalCode,
            billingCountry: data.billingCountry,
            paymentMethod: data.paymentMethod,
            paymentGatewayCustomerId: data.paymentGatewayCustomerId,
            accountStatus: data.accountStatus,
            creditLimit: data.creditLimit,
            currentBalance: data.currentBalance,
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
