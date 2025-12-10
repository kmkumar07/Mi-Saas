import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPlanRepository, PLAN_REPOSITORY } from '@domain/repositories/plan.repository.interface';
import { ProrationCalculation } from '@domain/entities/subscription.entity';

@Injectable()
export class CalculateProrationUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PLAN_REPOSITORY)
        private readonly planRepository: IPlanRepository,
    ) { }

    async execute(subscriptionId: string, newPlanId: string): Promise<ProrationCalculation & { currency: string }> {
        // 1. Get existing subscription
        const existingSubscription = await this.subscriptionRepository.findById(subscriptionId);
        if (!existingSubscription) {
            throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
        }

        // 2. Validate subscription can be upgraded
        if (existingSubscription.status !== 'active' && existingSubscription.status !== 'trial') {
            throw new BadRequestException(`Cannot calculate proration for subscription with status: ${existingSubscription.status}`);
        }

        // 3. Get current and new plans
        const currentPlan = await this.planRepository.findById(existingSubscription.planId);
        if (!currentPlan) {
            throw new NotFoundException(`Current plan ${existingSubscription.planId} not found`);
        }

        const newPlan = await this.planRepository.findById(newPlanId);
        if (!newPlan) {
            throw new NotFoundException(`New plan ${newPlanId} not found`);
        }

        // 4. Validate upgrade is allowed
        if (!existingSubscription.canUpgradeToPlan(newPlan)) {
            throw new BadRequestException('Cannot upgrade to this plan');
        }

        // 5. Calculate prorated amount
        const proration = existingSubscription.calculateUpgradeAmount(currentPlan, newPlan);

        return {
            ...proration,
            currency: newPlan.price.currency,
        };
    }
}

