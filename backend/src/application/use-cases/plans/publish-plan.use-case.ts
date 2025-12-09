import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPlanRepository, PLAN_REPOSITORY, IProductRepository, PRODUCT_REPOSITORY, IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { PlanResponseDto } from '../../dtos/plan-response.dto';
import { PlanResponseMapper } from '@application/mappers/plan-response.mapper';
import { PlanPersistenceService } from '@infrastructure/persistence/plan-persistence.service';
import { Plan, Product, Feature } from '@domain/entities';

/**
 * Use case for publishing a plan
 * Changes plan status from draft to published and creates product versions for immutability
 */
@Injectable()
export class PublishPlanUseCase {
    constructor(
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        private readonly planResponseMapper: PlanResponseMapper,
        private readonly planPersistenceService: PlanPersistenceService,
    ) { }

    async execute(planId: string): Promise<PlanResponseDto> {
        // Step 1: Load existing plan
        const existingPlan = await this.planRepository.findById(planId);
        if (!existingPlan) {
            throw new NotFoundException(`Plan with ID ${planId} not found`);
        }

        // Step 2: Validate plan can be published
        if (existingPlan.isPublished) {
            throw new BadRequestException('Plan is already published');
        }

        if (existingPlan.status === 'archived') {
            throw new BadRequestException('Cannot publish an archived plan');
        }

        // Step 3: Publish the plan (changes status to published)
        existingPlan.publish();

        // Step 4: Fetch products and features for the plan
        const products: Product[] = [];
        for (const productId of existingPlan.productIds) {
            const product = await this.productRepository.findById(productId);
            if (!product) {
                throw new NotFoundException(`Product with ID ${productId} not found`);
            }
            products.push(product);
        }

        // Step 5: Fetch features for all products
        const productFeatures: Map<string, Feature[]> = new Map();
        for (const product of products) {
            const features = await this.featureRepository.findByProductId(product.id!);
            if (features.length > 0) {
                productFeatures.set(product.id!, features);
            }
        }

        // Step 6: Persist the published plan with product versions
        // The persistence service will create product versions and link to them
        const saved = await this.planPersistenceService.savePlanWithExistingEntities(
            existingPlan,
            products,
            productFeatures,
            [], // No feature config changes, just publishing
        );

        // Step 7: Map to response DTO
        return this.planResponseMapper.toResponseDto(
            saved.plan,
            saved.products,
            saved.productFeatures,
        );
    }
}

