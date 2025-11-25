import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSubscriptionUseCase } from '@application/use-cases/subscriptions/create-subscription.use-case';
import { CreateSubscriptionDto } from '@application/dtos/create-subscription.dto';
import { SubscriptionResponseDto } from '@application/dtos/subscription-response.dto';

@ApiTags('subscriptions')
@Controller('api/subscriptions')
export class SubscriptionsController {
    constructor(
        private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
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
}


