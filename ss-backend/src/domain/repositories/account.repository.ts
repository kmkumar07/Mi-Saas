import { Account } from '../entities/account.entity';

export interface IAccountRepository {
    create(account: Account): Promise<Account>;
    findById(id: string): Promise<Account | null>;
    findByTenantId(tenantId: string): Promise<Account[]>;
    findChildAccounts(parentAccountId: string): Promise<Account[]>;
    update(account: Account): Promise<Account>;
    delete(id: string): Promise<void>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
