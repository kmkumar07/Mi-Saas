import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IOrganizationAdminRepository } from '../../../domain/repositories/organization-admin.repository.interface';

/**
 * Check Organization Admin Use Case
 * Verifies that an organization member has administrative authority over a tenant
 * 
 * CRITICAL RULES:
 * - Organization Admins MUST also be organization_members (enforced by FK)
 * - Admin status is an ADDITIVE layer, not a replacement for membership
 * - Admin status grants tenant governance (billing, member management, IdP config)
 * - Admin status does NOT bypass RBAC - admins still need RBAC permissions for features
 * - This layer must NOT bypass RBAC with ad-hoc if/else logic
 * 
 * Use cases for admin authority:
 * - Tenant configuration
 * - Billing management
 * - Identity provider configuration
 * - Member management
 */
@Injectable()
export class CheckOrgAdminUseCase {
    constructor(
        @Inject('IOrganizationAdminRepository')
        private readonly organizationAdminRepository: IOrganizationAdminRepository,
    ) { }

    /**
     * Verify organization admin status
     * @param organizationMemberId - The JWT sub claim (organization_members.id)
     * @param tenantId - The tenant ID being managed
     * @throws ForbiddenException if member is not an admin for this tenant
     */
    async execute(organizationMemberId: string, tenantId: string): Promise<void> {
        const isAdmin = await this.organizationAdminRepository.existsByOrganizationMemberIdAndTenantId(
            organizationMemberId,
            tenantId
        );

        if (!isAdmin) {
            throw new ForbiddenException('Administrative authority required');
        }

        // Member has admin status
        // NOTE: This grants tenant governance, but does NOT bypass RBAC for feature access
    }
}

