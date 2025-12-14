import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantActivationController } from '../controllers/tenant-activation.controller';
import { ActivateTenantPlanUseCase } from '../../application/use-cases/tenant-activation/activate-tenant-plan.use-case';
import { TenantActivationService } from '../../infrastructure/services/tenant-activation.service';
import { TENANT_ACTIVATION_SERVICE } from '../../domain/services/tenant-activation.service.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { PlansModule } from '../../plans.module';
import { InternalIntegrationModule } from '../../internal-integration/internal-integration.module';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/repositories/subscription.repository';
import { SubscriptionRepository } from '../../infrastructure/database/repositories/subscription.repository';

@Module({
    imports: [ConfigModule, DatabaseModule, PlansModule, InternalIntegrationModule],
    controllers: [TenantActivationController],
    providers: [
        ActivateTenantPlanUseCase,
        {
            provide: TENANT_ACTIVATION_SERVICE,
            useClass: TenantActivationService,
        },
        {
            provide: SUBSCRIPTION_REPOSITORY,
            useClass: SubscriptionRepository,
        },
    ],
    exports: [ActivateTenantPlanUseCase],
})
export class TenantActivationModule { }

