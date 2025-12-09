import { Body, Controller, HttpCode, HttpStatus, Post, Patch, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateSubscriptionUseCase } from '@application/use-cases/subscriptions/create-subscription.use-case';
import { UpgradeSubscriptionUseCase } from '@application/use-cases/subscriptions/upgrade-subscription.use-case';
import { CreateUpgradePaymentOrderUseCase } from '@application/use-cases/subscriptions/create-upgrade-payment-order.use-case';
import { CompleteUpgradeUseCase } from '@application/use-cases/subscriptions/complete-upgrade.use-case';
import { CalculateProrationUseCase } from '@application/use-cases/subscriptions/calculate-proration.use-case';
import { CreateSubscriptionDto } from '@application/dtos/create-subscription.dto';
import { UpgradeSubscriptionDto, UpgradeSubscriptionResponseDto } from '@application/dtos/upgrade-subscription.dto';
import { VerifyPaymentDto } from '@application/dtos/verify-payment.dto';
import { PaymentOrderResponseDto } from '@application/dtos/payment-order-response.dto';
import { SubscriptionResponseDto } from '@application/dtos/subscription-response.dto';

@ApiTags('subscriptions')
@Controller('api/subscriptions')
export class SubscriptionsController {
    constructor(
        private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
        private readonly upgradeSubscriptionUseCase: UpgradeSubscriptionUseCase,
        private readonly createUpgradePaymentOrderUseCase: CreateUpgradePaymentOrderUseCase,
        private readonly completeUpgradeUseCase: CompleteUpgradeUseCase,
        private readonly calculateProrationUseCase: CalculateProrationUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new subscription (customer purchase)' })
    @ApiResponse({
        status: 201,
        description: 'Subscription created successfully',
        type: SubscriptionResponseDto,
    })
    async create(
        @Body() dto: CreateSubscriptionDto,
    ): Promise<SubscriptionResponseDto> {
        return this.createSubscriptionUseCase.execute(dto);
    }

    @Get(':id/proration')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Calculate proration amount for upgrading a subscription' })
    @ApiParam({ name: 'id', description: 'Subscription ID' })
    @ApiQuery({ name: 'newPlanId', description: 'New plan ID to upgrade to' })
    @ApiResponse({
        status: 200,
        description: 'Proration calculated successfully',
    })
    @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    async calculateProration(
        @Param('id') subscriptionId: string,
        @Query('newPlanId') newPlanId: string,
    ) {
        return this.calculateProrationUseCase.execute(subscriptionId, newPlanId);
    }

    @Post(':id/upgrade/payment-order')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a payment order for upgrading a subscription (Razorpay flow)' })
    @ApiParam({ name: 'id', description: 'Subscription ID to upgrade' })
    @ApiResponse({
        status: 201,
        description: 'Payment order created successfully',
        type: PaymentOrderResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
    @ApiResponse({ status: 400, description: 'Invalid upgrade request' })
    async createUpgradePaymentOrder(
        @Param('id') subscriptionId: string,
        @Body() dto: Omit<UpgradeSubscriptionDto, 'subscriptionId'>,
    ): Promise<PaymentOrderResponseDto> {
        return this.createUpgradePaymentOrderUseCase.execute({
            ...dto,
            subscriptionId,
        });
    }

    @Post(':id/upgrade/complete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Complete upgrade after payment verification' })
    @ApiParam({ name: 'id', description: 'Subscription ID (for reference, not used)' })
    @ApiResponse({
        status: 200,
        description: 'Upgrade completed successfully',
        type: UpgradeSubscriptionResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Payment order or subscription not found' })
    @ApiResponse({ status: 400, description: 'Invalid payment or upgrade request' })
    async completeUpgrade(
        @Param('id') subscriptionId: string,
        @Body() dto: VerifyPaymentDto,
    ): Promise<UpgradeSubscriptionResponseDto> {
        return this.completeUpgradeUseCase.execute(dto);
    }

    @Patch(':id/upgrade')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upgrade a subscription to a new plan with pro-rated pricing (direct payment - deprecated, use payment-order flow)' })
    @ApiParam({ name: 'id', description: 'Subscription ID to upgrade' })
    @ApiResponse({
        status: 200,
        description: 'Subscription upgraded successfully',
        type: UpgradeSubscriptionResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
    @ApiResponse({ status: 400, description: 'Invalid upgrade request' })
    async upgrade(
        @Param('id') subscriptionId: string,
        @Body() dto: Omit<UpgradeSubscriptionDto, 'subscriptionId'>,
    ): Promise<UpgradeSubscriptionResponseDto> {
        return this.upgradeSubscriptionUseCase.execute({
            ...dto,
            subscriptionId,
        });
    }
}


