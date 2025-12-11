import { Injectable, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface RecordUsagePayload {
  tenantId: string;
  customerId?: string;
  featureCode: string;
  usage: number;
  idempotencyKey: string;
}

@Injectable()
export class UsageService {
  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Decode a JWT without verifying the signature (sufficient for internal test app).
   * We only need tenantId and sub (customerId) from the payload.
   */
  private decodeToken(token: string): { tenantId?: string; sub?: string } {
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64').toString('utf8'),
      );
      return decoded;
    } catch {
      return {};
    }
  }

  /**
   * Record usage for a given feature code by calling the SaaS backend `/usage` endpoint.
   * - tenantId is extracted from the JWT payload.
   * - customerId is taken from JWT `sub`.
   * - featureCode is passed in (e.g. 'studio_shops') so it is fully dynamic.
   * - usage amount is provided by the caller (controller-level logic).
   */
  async recordUsageFromToken(
    token: string,
    featureCode: string,
    usage: number,
  ): Promise<void> {
    const saasBaseUrl =
      this.configService.get<string>('SAAS_BACKEND_BASE_URL') ??
      'http://localhost:3000';
    const usagePath =
      this.configService.get<string>('SAAS_USAGE_PATH') ?? '/usage';

    const { tenantId, sub: customerId } = this.decodeToken(token);
    if (!tenantId || !customerId) {
      throw new ForbiddenException(
        'Missing tenant or customer information in access token.',
      );
    }
    const idempotencyKey =
      this.configService.get<string>('SAAS_USAGE_IDEMPOTENCY_KEY') ??
      `thirdparty-usage-${Date.now()}`;

    const payload: RecordUsagePayload = {
      tenantId,
      //   customerId,
      featureCode,
      usage,
      idempotencyKey,
    };

    const url = `${saasBaseUrl}${usagePath}`;

    try {
      const response = await firstValueFrom(
        this.http.post(url, payload, {
          headers: {
            // Mirror the sample curl
            Accept: 'application/json',
            'Content-Type': 'application/json',
            // Forward the same JWT if SaaS backend wants to validate it
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      const data = response.data;
      if (data && data.limitExceeded) {
        throw new ForbiddenException(
          `Usage limit exceeded for feature ${data.featureCode}. Used: ${data.totalUsed}, Limit: ${data.limit}, Remaining: ${data.remaining}`,
        );
      }
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Handle axios errors where response data might contain the limit info
      if (error.response?.data?.limitExceeded) {
        const data = error.response.data;
        throw new ForbiddenException(
          `Usage limit exceeded for feature ${data.featureCode}. Used: ${data.totalUsed}, Limit: ${data.limit}, Remaining: ${data.remaining}`,
        );
      }

      console.error('Failed to record usage for feature:', error);
      throw new ForbiddenException(
        'Failed to record usage for feature.',
      );
    }
  }
}


