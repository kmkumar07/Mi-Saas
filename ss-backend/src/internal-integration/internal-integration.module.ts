import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InternalFeaturesController } from './controllers/internal-features.controller';
import { GetTenantFeaturesUseCase } from './use-cases/get-tenant-features.use-case';
import { UamIntegrationService } from './services/uam-integration.service';
import { TenantsModule } from '../presentation/modules/tenants.module';

/**
 * Internal Integration Module
 * Handles inter-service communication endpoints and services
 */
@Module({
    imports: [ConfigModule, TenantsModule], // Import to get GetTenantDashboardUseCase
    controllers: [InternalFeaturesController],
    providers: [
        GetTenantFeaturesUseCase,
        UamIntegrationService,
    ],
    exports: [UamIntegrationService], // Export for use in other modules
})
export class InternalIntegrationModule { }
