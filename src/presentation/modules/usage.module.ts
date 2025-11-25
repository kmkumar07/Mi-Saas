import { Module } from '@nestjs/common';
import { UsageController } from '../controllers/usage.controller';
import { RecordUsageUseCase } from '../../application/use-cases/usage/record-usage.use-case';
import { GetEntitlementsUseCase } from '../../application/use-cases/usage/get-entitlements.use-case';
import { UsageEventRepository } from '../../infrastructure/database/repositories/usage-event.repository';
import { SubscriptionRepository } from '../../infrastructure/database/repositories/subscription.repository';
import { PlanRepository } from '../../infrastructure/database/repositories/plan.repository';
import { ProductRepository } from '../../infrastructure/database/repositories/product.repository';
import { FeatureRepository } from '../../infrastructure/database/repositories/feature.repository';
import { USAGE_EVENT_REPOSITORY } from '../../domain/repositories/usage-event.repository';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/repositories/subscription.repository';
import { PLAN_REPOSITORY, PRODUCT_REPOSITORY, FEATURE_REPOSITORY } from '@domain/repositories';

@Module({
    controllers: [UsageController],
    providers: [
        RecordUsageUseCase,
        GetEntitlementsUseCase,
        {
            provide: USAGE_EVENT_REPOSITORY,
            useClass: UsageEventRepository,
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
    ],
})
export class UsageModule { }
