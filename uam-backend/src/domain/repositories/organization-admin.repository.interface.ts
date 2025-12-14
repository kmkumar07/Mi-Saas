import { OrganizationAdmin } from '../entities/organization-admin.entity';

/**
 * Organization Admin Repository Interface
 * Defines contract for organization admin persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 * 
 * CRITICAL: Organization admins MUST also be organization_members (enforced by FK).
 * Admin status is additive and does NOT bypass RBAC.
 */
export interface IOrganizationAdminRepository {
    findById(id: string): Promise<OrganizationAdmin | null>;
    findByOrganizationMemberId(organizationMemberId: string): Promise<OrganizationAdmin | null>;
    findByTenantId(tenantId: string): Promise<OrganizationAdmin[]>;
    existsByOrganizationMemberId(organizationMemberId: string): Promise<boolean>;
    existsByOrganizationMemberIdAndTenantId(organizationMemberId: string, tenantId: string): Promise<boolean>;
    create(admin: OrganizationAdmin): Promise<OrganizationAdmin>;
    delete(id: string): Promise<void>;
    deleteByOrganizationMemberId(organizationMemberId: string): Promise<void>;
}

