import { Injectable, Inject } from '@nestjs/common';
import { ITenantActivationService, ActivateTenantPlanRequest, ActivateTenantPlanResponse } from '../../domain/services/tenant-activation.service.interface';
import { UamIntegrationService } from '../../internal-integration/services/uam-integration.service';

/**
 * Tenant Activation Service Implementation
 * Uses UAM Integration Service to call UAM backend for tenant activation
 * Follows internal integration service pattern
 */
@Injectable()
export class TenantActivationService implements ITenantActivationService {
    constructor(
        private readonly uamIntegrationService: UamIntegrationService,
    ) { }

    async activateTenantPlan(
        request: ActivateTenantPlanRequest,
    ): Promise<ActivateTenantPlanResponse> {
        return this.uamIntegrationService.activateTenantPlan(request);
    }
}

