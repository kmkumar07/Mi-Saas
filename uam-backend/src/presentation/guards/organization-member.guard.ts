import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CheckMembershipUseCase } from '../../application/use-cases/authorization/check-membership.use-case';

/**
 * Organization Member Guard
 * Enforces the baseline membership requirement
 * 
 * CRITICAL: This guard verifies organization membership - the REQUIRED layer for all access.
 * No actor can access tenant or product resources without being an organization member.
 * 
 * This guard enforces the core principle:
 * Identity → Organization Member (baseline, required)
 * 
 * Usage:
 * @UseGuards(OrganizationMemberGuard)
 * @Get('some-endpoint')
 */
@Injectable()
export class OrganizationMemberGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly checkMembershipUseCase: CheckMembershipUseCase,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        
        // Extract JWT token
        const token = this.extractToken(request);
        if (!token) {
            throw new UnauthorizedException('Missing authentication token');
        }

        // Decode JWT to get organizationMemberId and tenantId
        let payload: any;
        try {
            payload = this.jwtService.decode(token);
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        const organizationMemberId = payload?.sub; // JWT sub = organization_members.id
        const tenantId = payload?.tenantId || request.headers['x-tenant-id'] || request.body?.tenantId;

        if (!organizationMemberId) {
            throw new UnauthorizedException('Invalid token payload - missing organization member ID');
        }

        if (!tenantId) {
            throw new ForbiddenException('Tenant ID is required');
        }

        // Verify organization membership (BASELINE CHECK)
        // This is the first and most critical check - all other authorization builds on this
        await this.checkMembershipUseCase.execute(organizationMemberId, tenantId);

        // Attach to request for use in controllers
        request.organizationMemberId = organizationMemberId;
        request.tenantId = tenantId;

        return true;
    }

    private extractToken(request: any): string | null {
        // Try Authorization header first
        const authHeader = request.headers['authorization'] || request.headers['Authorization'];
        if (authHeader && !Array.isArray(authHeader) && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }

        // Try cookie
        const cookieHeader = request.headers['cookie'];
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map((c: string) => c.trim());
            const prefix = 'uam_access_token=';
            for (const cookie of cookies) {
                if (cookie.startsWith(prefix)) {
                    return decodeURIComponent(cookie.substring(prefix.length));
                }
            }
        }

        return null;
    }
}

