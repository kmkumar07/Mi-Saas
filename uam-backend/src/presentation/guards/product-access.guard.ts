import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { CheckProductAccessUseCase } from '../../application/use-cases/authorization/check-product-access.use-case';

/**
 * Product Access Guard
 * Verifies that an organization member has access to a specific product
 * 
 * CRITICAL RULES:
 * - Product access is an ADDITIVE layer on top of organization membership
 * - Product access determines scope (which products), but does NOT bypass RBAC
 * - Product access MUST be checked before or alongside RBAC
 * 
 * This guard enforces scope control: determines WHO can access WHICH products,
 * while RBAC determines WHAT actions are allowed within those products.
 * 
 * Usage:
 * @UseGuards(OrganizationMemberGuard, ProductAccessGuard)
 * @Get('product/:productId/endpoint')
 */
@Injectable()
export class ProductAccessGuard implements CanActivate {
    constructor(
        private readonly checkProductAccessUseCase: CheckProductAccessUseCase,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        
        // Get organizationMemberId and tenantId from previous guard (OrganizationMemberGuard)
        const organizationMemberId = request.organizationMemberId;
        const tenantId = request.tenantId;

        if (!organizationMemberId || !tenantId) {
            throw new ForbiddenException('Organization membership must be verified first');
        }

        // Extract productId from route params, query, or body
        const productId = request.params?.productId 
            || request.query?.productId 
            || request.body?.productId
            || request.headers['x-product-id'];

        if (!productId) {
            throw new ForbiddenException('Product ID is required');
        }

        // Verify product access (SCOPE CHECK)
        // This grants scope, but RBAC still applies for feature permissions
        await this.checkProductAccessUseCase.execute(organizationMemberId, productId, tenantId);

        // Attach to request for use in controllers
        request.productId = productId;

        return true;
    }
}

