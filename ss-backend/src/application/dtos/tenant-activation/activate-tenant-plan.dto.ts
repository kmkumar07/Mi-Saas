export class ActivateTenantPlanDto {
    tenantId: string;
    subscriptionId: string;
}

export class ActivateTenantPlanResponseDto {
    success: boolean;
    message: string;
    roleId?: string;
    roleCode?: string;
    permissionsCreated?: number;
    grantsCreated?: number;
}

