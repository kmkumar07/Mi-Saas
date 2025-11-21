import { Product } from '../entities';

export interface IProductRepository {
    create(product: Product): Promise<Product>;
    findById(id: string): Promise<Product | null>;
    findByTenantId(tenantId: string): Promise<Product[]>;
    findAll(): Promise<Product[]>;
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
