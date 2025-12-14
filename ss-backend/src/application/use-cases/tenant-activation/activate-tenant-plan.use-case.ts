import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories/feature.repository.interface';
import { ITenantActivationService, TENANT_ACTIVATION_SERVICE } from '@domain/services/tenant-activation.service.interface';
import { ActivateTenantPlanDto, ActivateTenantPlanResponseDto } from '@application/dtos/tenant-activation/activate-tenant-plan.dto';

/**
 * Activate Tenant Plan Use Case
 * Activates a tenant plan after payment completion.
 * 
 * This use case:
 * 1. Gets subscription and plan details
 * 2. Gets organization admin for tenant
 * 3. Gets all products in the plan
 * 4. Gets all features for all products
 * 5. Checks idempotency (if already activated, skip)
 * 6. Creates admin role with permissions
 * 7. Syncs product access grants
 * 
 * This is idempotent - can be called multiple times safely.
 */
@Injectable()
export class ActivateTenantPlanUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
        @Inject(TENANT_ACTIVATION_SERVICE)
        private readonly tenantActivationService: ITenantActivationService,
    ) { }

    async execute(dto: ActivateTenantPlanDto): Promise<ActivateTenantPlanResponseDto> {
        const { tenantId, subscriptionId } = dto;

        // 1. Get subscription
        const subscription = await this.subscriptionRepository.findById(subscriptionId);
        if (!subscription) {
            throw new NotFoundException(`Subscription ${subscriptionId} not found`);
        }

        if (subscription.tenantId !== tenantId) {
            throw new NotFoundException(`Subscription does not belong to tenant ${tenantId}`);
        }

        // 2. Get plan
        const plan = await this.planRepository.findById(subscription.planId);
        if (!plan) {
            throw new NotFoundException(`Plan ${subscription.planId} not found`);
        }

        // 3. Get all products in the plan
        const productIds = plan.productIds || [];
        if (productIds.length === 0) {
            throw new NotFoundException(`Plan ${plan.id} has no products`);
        }

        // 4. Get all features for all products
        const allFeatures: string[] = [];
        for (const productId of productIds) {
            const features = await this.featureRepository.findByProductId(productId);
            allFeatures.push(...features.map(f => f.id));
        }

        if (allFeatures.length === 0) {
            // No features to grant, but still proceed with product access
            console.warn(`Plan ${plan.id} has no features, proceeding with product access only`);
        }

        // 5. Generate role code (use plan code if available, otherwise use tenant ID)
        const roleCode = plan.planCode ? `admin_${plan.planCode}` : `${tenantId}_admin`;
        const roleName = plan.name ? `Admin - ${plan.name}` : `Admin Role for Tenant ${tenantId}`;

        // 6. Call UAM backend to activate tenant plan (single endpoint that handles everything)
        let activationResult;
        try {
            activationResult = await this.tenantActivationService.activateTenantPlan({
                tenantId,
                productIds,
                featureIds: allFeatures,
                roleCode,
                roleName,
            });
        } catch (error: any) {
            throw new Error(`Failed to activate tenant plan: ${error.message}`);
        }

        return {
            success: activationResult.success,
            message: 'Tenant plan activated successfully',
            roleId: activationResult.roleId,
            roleCode: activationResult.roleCode,
            permissionsCreated: activationResult.permissionsCreated,
            grantsCreated: activationResult.grantsCreated,
        };
    }
}

