import { Injectable, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PermissionAction } from './permissions.decorator';

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

export interface PermissionDecision {
  tenantId: string;
  featureName?: string;
  permissionAction: PermissionAction | 'any';
}

@Injectable()
export class PermissionCheckerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calls UAM and throws ForbiddenException if the user does NOT have the required permission.
   * Returns minimal info (tenantId, featureName, effective permissionAction) on success.
   */
  async assertHasPermission(
    token: string,
    featureKey: string,
    permissionAction?: PermissionAction,
  ): Promise<PermissionDecision> {
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

    const uamUrl = `${uamBaseUrl}${uamPermissionPath}`;

    try {
      const uamResponse = await firstValueFrom(
        this.httpService.get(uamUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-product-id': productId,
          },
        }),
      );

      const matrix = uamResponse.data as UserProductPermissionsResponseDto;

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

      if (!matrix.tenantId) {
        throw new ForbiddenException('Tenant id is missing in permission matrix');
      }

      return {
        tenantId: matrix.tenantId,
        featureName: targetFeature?.featureName,
        permissionAction: permissionAction ?? 'any',
      };
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


