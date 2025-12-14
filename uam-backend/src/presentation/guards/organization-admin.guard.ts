import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { CheckOrgAdminUseCase } from '../../application/use-cases/authorization/check-org-admin.use-case';

/**
 * Organization Admin Guard
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
 * 
 * Usage:
 * @UseGuards(OrganizationMemberGuard, OrganizationAdminGuard)
 * @Post('admin/configure-tenant')
 */
@Injectable()
export class OrganizationAdminGuard implements CanActivate {
    constructor(
        private readonly checkOrgAdminUseCase: CheckOrgAdminUseCase,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        
        // Get organizationMemberId and tenantId from previous guard (OrganizationMemberGuard)
        const organizationMemberId = request.organizationMemberId;
        const tenantId = request.tenantId;

        if (!organizationMemberId || !tenantId) {
            throw new ForbiddenException('Organization membership must be verified first');
        }

        // Verify organization admin status (TENANT GOVERNANCE)
        // This grants tenant governance, but does NOT bypass RBAC for feature access
        await this.checkOrgAdminUseCase.execute(organizationMemberId, tenantId);

        // Attach to request for use in controllers
        request.isOrganizationAdmin = true;

        return true;
    }
}

