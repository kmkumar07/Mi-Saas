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
 * Tenant Activation Service Interface
 * Defines contract for calling UAM backend tenant activation endpoint
 */
export interface ITenantActivationService {
    activateTenantPlan(
        request: ActivateTenantPlanRequest,
    ): Promise<ActivateTenantPlanResponse>;
}

export const TENANT_ACTIVATION_SERVICE = Symbol('ITenantActivationService');

