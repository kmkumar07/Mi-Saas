import { Injectable, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface FeatureUsage {
  used: number;
  limit: number | null;
}

interface TenantEntitlementsResponse {
  features: Record<string, boolean>;
  usage: Record<string, FeatureUsage | undefined>;
}

export interface UsageDecision {
  used?: number;
  limit?: number | null;
}

@Injectable()
export class UsageEntitlementsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calls the SaaS backend /usage/entitlements/{tenantId} endpoint and throws
   * ForbiddenException if the feature is disabled or usage limit is exceeded.
   * Returns minimal usage info (used, limit) when allowed.
   */
  async assertWithinUsage(
    token: string,
    tenantId: string,
    featureKey: string,
  ): Promise<UsageDecision> {
    const saasBaseUrl = this.configService.get<string>(
      'SAAS_BACKEND_BASE_URL',
    );
    if (!saasBaseUrl) {
      throw new ForbiddenException('SAAS_BACKEND_BASE_URL is not configured');
    }

    const saasEntitlementsPath =
      this.configService.get<string>('SAAS_ENTITLEMENTS_PATH') ??
      '/usage/entitlements';

    const entitlementsUrl = `${saasBaseUrl}${saasEntitlementsPath}/${tenantId}`;

    try {
      const entitlementsResponse = await firstValueFrom(
        this.httpService.get(entitlementsUrl, {
          headers: {
            // Forward the same JWT so SaaS backend can also validate if needed
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      const entitlements =
        entitlementsResponse.data as TenantEntitlementsResponse;
      const featureKeyUpper = featureKey.toUpperCase();
      const featureEnabled = entitlements.features?.[featureKeyUpper];
      if (!featureEnabled) {
        throw new ForbiddenException(
          `Feature ${featureKey} is not enabled for this tenant`,
        );
      }

      const usageInfo = entitlements.usage?.[featureKey];

      if (usageInfo && usageInfo.limit !== null && usageInfo.limit !== undefined) {
        if (usageInfo.used >= usageInfo.limit) {
          throw new ForbiddenException(
            `Usage limit reached for feature ${featureKey}. Used ${usageInfo.used} of ${usageInfo.limit}.`,
          );
        }
      }

      return usageInfo
        ? {
            used: usageInfo.used,
            limit: usageInfo.limit,
          }
        : {};
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException(
        'Entitlement check with SaaS backend failed. Access denied.',
      );
    }
  }
}


