import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  REQUIRED_FEATURE_KEY,
  REQUIRED_PERMISSION_KEY,
  PermissionAction,
} from './permissions.decorator';

interface UserProductPermissionsResponseDto {
  tenantId: string;
  userId: string;
  products: {
    productId: string;
    productName: string;
    features: {
      featureId: string;
      featureName: string;
      featureCode: string;
      featureDescription?: string;
      featureType: string;
      canRead: boolean;
      canWrite: boolean;
      canExecute: boolean;
    }[];
  }[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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

    const uamBaseUrl = this.configService.get<string>('UAM_BASE_URL');
    const productId = this.configService.get<string>('PRODUCT_ID');
    if (!productId) {
      throw new ForbiddenException('PRODUCT_ID is not configured');
    }
    const uamPermissionPath =
      this.configService.get<string>('UAM_PERMISSION_CHECK_PATH') ??
      '/api/internal/permissions/user-product-matrix';

    if (!uamBaseUrl) {
      throw new ForbiddenException('UAM_BASE_URL is not configured');
    }

    const url = `${uamBaseUrl}${uamPermissionPath}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-product-id': productId,  
          },
        }),
      );

      const matrix = response.data as UserProductPermissionsResponseDto;

      // Flatten all features across products and find the one matching featureKey.
      const allFeatures = matrix.products.flatMap((p) => p.features ?? []);
      const targetFeature = allFeatures.find(
        (f) => f.featureCode === featureKey,
      );

      // Decide allowed based on requested permission action (read/write/execute).
      let allowed = false;
      if (targetFeature) {
        switch (permissionAction) {
          case 'read':
            allowed = !!targetFeature.canRead;
            break;
          case 'write':
            allowed = !!targetFeature.canWrite;
            break;
          case 'execute':
            allowed = !!targetFeature.canExecute;
            break;
          default:
            // If no specific action is requested, allow if any permission flag is true.
            allowed =
              targetFeature.canRead ||
              targetFeature.canWrite ||
              targetFeature.canExecute;
        }
      }

      if (!allowed) {
        throw new ForbiddenException(
          `You do not have permission for feature ${featureKey}`,
        );
      }

      // Attach minimal decision info so controllers can log or return it.
      request.permissionDecision = {
        allowed: true,
        featureKey,
        featureName: targetFeature?.featureName,
        permissionAction: permissionAction ?? 'any',
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException(
        'Permission check with UAM failed. Access denied.',
      );
    }
  }
}


