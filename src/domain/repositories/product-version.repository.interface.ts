import { ProductVersion } from '../entities/product-version.entity';

export const PRODUCT_VERSION_REPOSITORY = Symbol('PRODUCT_VERSION_REPOSITORY');

export interface IProductVersionRepository {
    create(productVersion: ProductVersion): Promise<ProductVersion>;
    findById(id: string): Promise<ProductVersion | null>;
    findByProductId(productId: string): Promise<ProductVersion[]>;
    findByProductIdAndVersion(productId: string, version: number): Promise<ProductVersion | null>;
    findLatestVersion(productId: string): Promise<ProductVersion | null>;
}

