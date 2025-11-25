import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { PlanRepository } from '@infrastructure/database/repositories/plan.repository';
import { ProductRepository } from '@infrastructure/database/repositories/product.repository';
import { FeatureRepository } from '@infrastructure/database/repositories/feature.repository';
import { SubscriptionRepository } from '@infrastructure/database/repositories/subscription.repository';
import { PLAN_REPOSITORY, PRODUCT_REPOSITORY, FEATURE_REPOSITORY, SUBSCRIPTION_REPOSITORY } from '@domain/repositories';
import { PlanResponseMapper } from '@application/mappers/plan-response.mapper';
import { ProductMapper } from '@infrastructure/mappers/product.mapper';
import { FeatureMapper } from '@infrastructure/mappers/feature.mapper';
import { PlanMapper } from '@infrastructure/mappers/plan.mapper';
import { PlanPersistenceService } from '@infrastructure/persistence/plan-persistence.service';
import { CreatePlanUseCase } from '@application/use-cases/plans/create-plan.use-case';
import { GetPlanUseCase } from '@application/use-cases/plans/get-plan.use-case';
import { UpdatePlanUseCase } from '@application/use-cases/plans/update-plan.use-case';
import { CreateProductUseCase } from '@application/use-cases/products/create-product.use-case';
import { CreateFeatureUseCase } from '@application/use-cases/features/create-feature.use-case';
import { PlansController } from '@presentation/controllers/plans.controller';
import { ProductsController } from '@presentation/controllers/products.controller';
import { FeaturesController } from '@presentation/controllers/features.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [PlansController, ProductsController, FeaturesController],
    providers: [
        // Repositories
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
            provide: SUBSCRIPTION_REPOSITORY,
            useClass: SubscriptionRepository,
        },
        // Application Mappers
        PlanResponseMapper,
        // Infrastructure Mappers
        ProductMapper,
        FeatureMapper,
        PlanMapper,
        // Infrastructure Services
        PlanPersistenceService,
        // Use Cases
        CreatePlanUseCase,
        GetPlanUseCase,
        UpdatePlanUseCase,
        CreateProductUseCase,
        CreateFeatureUseCase,
    ],
})
export class PlansModule { }
