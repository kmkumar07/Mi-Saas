import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_FEATURE_KEY,
  REQUIRED_PERMISSION_KEY,
  PermissionAction,
} from './permissions.decorator';
import {
  PermissionCheckerService,
  PermissionDecision,
} from './permission-checker.service';
import {
  UsageEntitlementsService,
  UsageDecision,
} from './usage-entitlements.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionChecker: PermissionCheckerService,
    private readonly usageEntitlements: UsageEntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey =
      this.reflector.get<string>(REQUIRED_FEATURE_KEY, context.getHandler()) ??
      this.reflector.get<string>(REQUIRED_FEATURE_KEY, context.getClass());

    const permissionAction =
      this.reflector.get<PermissionAction>(
        REQUIRED_PERMISSION_KEY,
        context.getHandler(),
      ) ??
      this.reflector.get<PermissionAction>(
        REQUIRED_PERMISSION_KEY,
        context.getClass(),
      );

    // If no feature is required, allow the request
    if (!featureKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.token;

    if (!token) {
      throw new ForbiddenException('Missing access token for permission check');
    }

    try {
      // 1) Permission check via UAM
      const permissionDecision: PermissionDecision =
        await this.permissionChecker.assertHasPermission(
          token,
          featureKey,
          permissionAction,
        );

      // 2) Usage / entitlement check via SaaS backend
      const usageDecision: UsageDecision =
        await this.usageEntitlements.assertWithinUsage(
          token,
          permissionDecision.tenantId,
          featureKey,
        );

      // Attach minimal decision info so controllers can log or return it.
      request.permissionDecision = {
        allowed: true,
        featureKey,
        featureName: permissionDecision.featureName,
        permissionAction: permissionDecision.permissionAction,
        usage: usageDecision,
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException(
        'Permission or entitlement check failed. Access denied.',
      );
    }
  }
}


