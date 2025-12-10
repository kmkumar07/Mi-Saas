import { Tenant } from '../entities';

export interface ITenantRepository {
    create(tenant: Tenant): Promise<Tenant>;
    findById(id: string): Promise<Tenant | null>;
    findByEmailDomain(emailDomain: string): Promise<Tenant | null>;
    findAll(): Promise<Tenant[]>;
    update(tenant: Tenant): Promise<Tenant>;
    delete(id: string): Promise<void>;
}

export const TENANT_REPOSITORY = Symbol('ITenantRepository');
