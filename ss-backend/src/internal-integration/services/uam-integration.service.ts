import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ActivateTenantPlanRequest {
    tenantId: string;
    productIds: string[];
    featureIds: string[];
    roleCode: string;
    roleName: string;
}

export interface ActivateTenantPlanResponse {
    success: boolean;
    organizationMemberId: string;
    roleId: string;
    roleCode: string;
    permissionsCreated: number;
    grantsCreated: number;
    grantsSkipped: number;
}

/**
 * UAM Integration Service
 * Handles HTTP calls to UAM backend for tenant activation operations
 * This is an internal integration service following the pattern used for inter-service communication
 */
@Injectable()
export class UamIntegrationService {
    private readonly uamBaseUrl: string;

    constructor(private configService: ConfigService) {
        // Get UAM backend URL from environment
        this.uamBaseUrl = this.configService.get<string>('UAM_BACKEND_URL') || 'http://localhost:3001';
    }

    async activateTenantPlan(
        request: ActivateTenantPlanRequest,
    ): Promise<ActivateTenantPlanResponse> {
        const url = `${this.uamBaseUrl}/api/internal/tenant-activation/activate`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to activate tenant plan: ${response.status} ${errorText}`);
        }

        return await response.json();
    }
}

