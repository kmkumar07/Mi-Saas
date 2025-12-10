import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequiredFeature, RequiredPermission } from '../auth/permissions.decorator';
import { UsageService } from './usage.service';

@Controller()
export class ThirdPartyController {
  constructor(private readonly usageService: UsageService) {}
  @Get('public/ping')
  ping(): string {
    return 'third-party public OK';
  }

  @Get('api/indoor_billing')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredFeature('indoor_billing')
  @RequiredPermission('read')
  featureX(@Req() req: Request): string {
    const decision = (req as any).permissionDecision as
      | { roleName?: string; featureKey?: string; allowed?: boolean }
      | undefined;

    const roleName = decision?.roleName ?? 'unknown-role';
    const featureKey = decision?.featureKey ?? 'THIRDPARTY_FEATURE_X';

    return `Access granted for role ${roleName} to feature ${featureKey}`;
  }

  @Post('api/shops')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredFeature('studio_shops')
  @RequiredPermission('write')
  async createShops(@Req() req: Request): Promise<string> {
    const decision = (req as any).permissionDecision as
      | {
          featureKey?: string;
          allowed?: boolean;
          usage?: { used?: number; limit?: number | null };
        }
      | undefined;

    const featureKey = decision?.featureKey ?? 'studio_shops';
    const used = decision?.usage?.used;
    const limit = decision?.usage?.limit;

    // Record usage for this feature on the SaaS backend.
    // featureKey comes from the permission decision (e.g. 'studio_shops'),
    // and tenant/customer info is stripped from the JWT payload.
    const token: string | undefined = (req as any).token;
    if (token && featureKey) {
      // Increase usage by 1 per request (controller-level decision)
      await this.usageService.recordUsageFromToken(token, featureKey, 1);
    }

    if (limit !== null && limit !== undefined && used !== undefined) {
      return `Shop created successfully. Usage for ${featureKey}: ${used}/${limit}.`;
    }

    return `Shop created successfully for feature ${featureKey}.`;
  }
} 


