import { Module } from '@nestjs/common';
import { InternalFeaturesController } from './controllers/internal-features.controller';
import { GetTenantFeaturesUseCase } from './use-cases/get-tenant-features.use-case';
import { TenantsModule } from '../presentation/modules/tenants.module';

/**
 * Internal Integration Module
 * Handles inter-service communication endpoints
 */
@Module({
    imports: [TenantsModule], // Import to get GetTenantDashboardUseCase
    controllers: [InternalFeaturesController],
    providers: [GetTenantFeaturesUseCase],
})
export class InternalIntegrationModule { }
