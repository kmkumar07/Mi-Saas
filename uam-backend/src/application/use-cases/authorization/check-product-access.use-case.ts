import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IProductAccessGrantRepository } from '../../../domain/repositories/product-access-grant.repository.interface';

/**
 * Check Product Access Use Case
 * Verifies that an organization member has access to a specific product
 * 
 * CRITICAL RULES:
 * - Product access is an ADDITIVE layer on top of organization membership
 * - Product access determines scope (which products), but does NOT bypass RBAC
 * - Product access MUST be checked before or alongside RBAC
 * - Product owners MUST also be organization_members (enforced by FK)
 * 
 * This use case enforces scope control: determines WHO can access WHICH products,
 * while RBAC determines WHAT actions are allowed within those products.
 */
@Injectable()
export class CheckProductAccessUseCase {
    constructor(
        @Inject('IProductAccessGrantRepository')
        private readonly productAccessGrantRepository: IProductAccessGrantRepository,
    ) { }

    /**
     * Verify product access
     * @param organizationMemberId - The JWT sub claim (organization_members.id)
     * @param productId - The product ID being accessed
     * @param tenantId - The tenant ID (for validation)
     * @throws ForbiddenException if member doesn't have access to the product
     */
    async execute(organizationMemberId: string, productId: string, tenantId: string): Promise<void> {
        const hasAccess = await this.productAccessGrantRepository.existsByOrganizationMemberIdAndProductIdAndTenantId(
            organizationMemberId,
            productId,
            tenantId
        );

        if (!hasAccess) {
            throw new ForbiddenException('No access to this product');
        }

        // Member has product access grant
        // NOTE: This does NOT grant feature permissions - RBAC still applies
    }
}

