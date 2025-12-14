import { OrganizationMember } from '../entities/organization-member.entity';

/**
 * Organization Member Repository Interface
 * Defines contract for organization member persistence operations
 * Follows Interface Segregation Principle and Dependency Inversion Principle
 * 
 * CRITICAL: This repository manages the baseline membership requirement.
 * All authorization checks must start with verifying organization membership.
 */
export interface IOrganizationMemberRepository {
    findById(id: string): Promise<OrganizationMember | null>;
    findByIdentityId(identityId: string): Promise<OrganizationMember[]>;
    findByTenantId(tenantId: string): Promise<OrganizationMember[]>;
    findByIdentityIdAndTenantId(identityId: string, tenantId: string): Promise<OrganizationMember | null>;
    findActiveById(id: string): Promise<OrganizationMember | null>;
    findActiveByIdentityIdAndTenantId(identityId: string, tenantId: string): Promise<OrganizationMember | null>;
    create(member: OrganizationMember): Promise<OrganizationMember>;
    update(member: OrganizationMember): Promise<OrganizationMember>;
    delete(id: string): Promise<void>;
    existsByIdentityIdAndTenantId(identityId: string, tenantId: string): Promise<boolean>;
}

