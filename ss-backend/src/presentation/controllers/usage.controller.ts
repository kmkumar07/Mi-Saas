import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { RecordUsageUseCase } from '../../application/use-cases/usage/record-usage.use-case';
import { GetEntitlementsUseCase } from '../../application/use-cases/usage/get-entitlements.use-case';
import { RecordUsageDto, EntitlementsResponseDto, RecordUsageResponseDto } from '../../application/dtos/usage.dto';

@ApiTags('usage')
@Controller('usage')
export class UsageController {
    constructor(
        private readonly recordUsageUseCase: RecordUsageUseCase,
        private readonly getEntitlementsUseCase: GetEntitlementsUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Record usage for a feature' })
    @ApiBody({ type: RecordUsageDto })
    @ApiResponse({
        status: 200,
        description: 'Usage recorded successfully (or limit reached with detailed status)',
        type: RecordUsageResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'Feature not found or no active subscriptions' })
    @ApiResponse({ status: 422, description: 'Validation error' })
    async recordUsage(@Body() dto: RecordUsageDto): Promise<RecordUsageResponseDto> {
        return await this.recordUsageUseCase.execute(dto);
    }

    @Get('entitlements/:tenantId')
    @ApiOperation({ summary: 'Get entitlements and usage for a tenant' })
    @ApiParam({
        name: 'tenantId',
        description: 'Tenant UUID',
        example: 'eca56dfd-6911-4bb7-ade6-38841a93f875',
    })
    @ApiResponse({
        status: 200,
        description: 'Entitlements and usage retrieved successfully',
        type: EntitlementsResponseDto,
    })
    @ApiResponse({ status: 404, description: 'No active subscriptions found for tenant' })
    async getEntitlements(
        @Param('tenantId') tenantId: string,
    ): Promise<EntitlementsResponseDto> {
        return this.getEntitlementsUseCase.execute(tenantId);
    }
}
