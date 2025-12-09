export interface CreateTenantPayload {
    name: string;
    emailDomain?: string;
    accountType?: 'individual' | 'company';
    workspaceName?: string;
    metadata?: Record<string, any>;
}

export interface CreatedTenant {
    id: string;
    name: string;
}

export const TENANT_PROVISIONING_CLIENT = 'TENANT_PROVISIONING_CLIENT';

export interface ITenantProvisioningClient {
    createTenant(payload: CreateTenantPayload): Promise<CreatedTenant>;
}


