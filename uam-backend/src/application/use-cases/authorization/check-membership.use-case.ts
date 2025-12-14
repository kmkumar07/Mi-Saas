import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository.interface';

/**
 * Check Membership Use Case
 * Verifies that an organization member exists and is active for a given tenant
 * 
 * CRITICAL: This is the baseline check - all authorization must start here.
 * No actor can access tenant or product resources without being an organization member.
 * 
 * This use case enforces the core principle:
 * Identity → Organization Member (baseline, required)
 */
@Injectable()
export class CheckMembershipUseCase {
    constructor(
        @Inject('IOrganizationMemberRepository')
        private readonly organizationMemberRepository: IOrganizationMemberRepository,
    ) { }

    /**
     * Verify organization membership
     * @param organizationMemberId - The JWT sub claim (organization_members.id)
     * @param tenantId - The tenant ID being accessed
     * @throws ForbiddenException if member doesn't exist, is inactive, or tenant doesn't match
     */
    async execute(organizationMemberId: string, tenantId: string): Promise<void> {
        const member = await this.organizationMemberRepository.findActiveById(organizationMemberId);

        if (!member) {
            throw new ForbiddenException('Not a member of this organization or membership is inactive');
        }

        if (member.tenantId !== tenantId) {
            throw new ForbiddenException('Not a member of this organization');
        }

        // Member exists, is active, and belongs to the requested tenant
        // This is the baseline requirement - all other authorization layers build on this
    }
}

