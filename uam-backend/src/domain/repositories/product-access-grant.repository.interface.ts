import { ProductAccessGrant } from '../entities/product-access-grant.entity';

/**
 * Product Access Grant Repository Interface
 * Defines contract for product access grant persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 * 
 * CRITICAL: Product access grants MUST also have organization_membership (enforced by FK).
 * Product access is additive and determines scope, but does NOT bypass RBAC.
 */
export interface IProductAccessGrantRepository {
    findById(id: string): Promise<ProductAccessGrant | null>;
    findByOrganizationMemberId(organizationMemberId: string): Promise<ProductAccessGrant[]>;
    findByProductId(productId: string): Promise<ProductAccessGrant[]>;
    findByTenantId(tenantId: string): Promise<ProductAccessGrant[]>;
    findByOrganizationMemberIdAndProductId(organizationMemberId: string, productId: string): Promise<ProductAccessGrant | null>;
    findByOrganizationMemberIdAndTenantId(organizationMemberId: string, tenantId: string): Promise<ProductAccessGrant[]>;
    existsByOrganizationMemberIdAndProductId(organizationMemberId: string, productId: string): Promise<boolean>;
    existsByOrganizationMemberIdAndProductIdAndTenantId(organizationMemberId: string, productId: string, tenantId: string): Promise<boolean>;
    create(grant: ProductAccessGrant): Promise<ProductAccessGrant>;
    delete(id: string): Promise<void>;
    deleteByOrganizationMemberIdAndProductId(organizationMemberId: string, productId: string): Promise<void>;
}

