import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequiredFeature, RequiredPermission } from '../auth/permissions.decorator';

@Controller()
export class ThirdPartyController {
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
}


