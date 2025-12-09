import { Injectable, Logger } from '@nestjs/common';
import { externalHttpClient } from '../axios.instance';
import {
    CreateTenantPayload,
    CreatedTenant,
    ITenantProvisioningClient,
} from '../interfaces/tenant-provisioning.interface';

@Injectable()
export class TenantProvisioningClient implements ITenantProvisioningClient {
    private readonly logger = new Logger(TenantProvisioningClient.name);

    async createTenant(payload: CreateTenantPayload): Promise<CreatedTenant> {
        try {
            const response = await externalHttpClient.post('/tenants', payload);

            return {
                id: response.data.id,
                name: response.data.name,
            };
        } catch (error: any) {
            this.logger.error(
                `Failed to create tenant in SaaS backend: ${error?.message ?? 'Unknown error'}`,
            );
            throw error;
        }
    }
}


