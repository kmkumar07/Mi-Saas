import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import {
    TENANT_REPOSITORY,
    SUBSCRIPTION_REPOSITORY,
    PLAN_REPOSITORY,
    PRODUCT_REPOSITORY,
    FEATURE_REPOSITORY,
    USAGE_EVENT_REPOSITORY,
    PLAN_FEATURE_CONFIG_REPOSITORY,
    PRICING_MODEL_REPOSITORY,
} from '@domain/repositories';
import { TenantRepository } from '@infrastructure/database/repositories/tenant.repository';
import { SubscriptionRepository } from '@infrastructure/database/repositories/subscription.repository';
import { PlanRepository } from '@infrastructure/database/repositories/plan.repository';
import { ProductRepository } from '@infrastructure/database/repositories/product.repository';
import { FeatureRepository } from '@infrastructure/database/repositories/feature.repository';
import { UsageEventRepository } from '@infrastructure/database/repositories/usage-event.repository';
import { PlanFeatureConfigRepository } from '@infrastructure/database/repositories/plan-feature-config.repository';
import { PricingModelRepository } from '@infrastructure/database/repositories/pricing-model.repository';
import { CreateTenantUseCase } from '@application/use-cases/tenants/create-tenant.use-case';
import { GetTenantUseCase } from '@application/use-cases/tenants/get-tenant.use-case';
import { GetAllTenantsUseCase } from '@application/use-cases/tenants/get-all-tenants.use-case';
import { GetTenantDashboardUseCase } from '@application/use-cases/tenants/get-tenant-dashboard.use-case';
import { GetPlanUseCase } from '@application/use-cases/plans/get-plan.use-case';
import { TenantsController } from '@presentation/controllers/tenants.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [TenantsController],
    providers: [
        {
            provide: TENANT_REPOSITORY,
            useClass: TenantRepository,
        },
        {
            provide: SUBSCRIPTION_REPOSITORY,
            useClass: SubscriptionRepository,
        },
        {
            provide: PLAN_REPOSITORY,
            useClass: PlanRepository,
        },
        {
            provide: PRODUCT_REPOSITORY,
            useClass: ProductRepository,
        },
        {
            provide: FEATURE_REPOSITORY,
            useClass: FeatureRepository,
        },
        {
            provide: USAGE_EVENT_REPOSITORY,
            useClass: UsageEventRepository,
        },
        {
            provide: PLAN_FEATURE_CONFIG_REPOSITORY,
            useClass: PlanFeatureConfigRepository,
        },
        {
            provide: PRICING_MODEL_REPOSITORY,
            useClass: PricingModelRepository,
        },
        CreateTenantUseCase,
        GetTenantUseCase,
        GetAllTenantsUseCase,
        GetPlanUseCase,
        GetTenantDashboardUseCase,
    ],
    exports: [TENANT_REPOSITORY, GetTenantDashboardUseCase],
})
export class TenantsModule { }
