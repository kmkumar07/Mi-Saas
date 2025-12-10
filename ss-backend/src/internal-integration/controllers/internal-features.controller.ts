import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetTenantFeaturesUseCase } from '../use-cases/get-tenant-features.use-case';
import { TenantFeaturesResponseDto } from '../dtos/tenant-features-response.dto';

/**
 * Internal Integration Controller for Features
 * Provides endpoints for inter-service communication
 * Specifically designed for UAM service to fetch tenant features
 */
@ApiTags('internal-integration')
@Controller('api/internal/features')
export class InternalFeaturesController {
    constructor(
        private readonly getTenantFeaturesUseCase: GetTenantFeaturesUseCase,
    ) { }

    @Get('tenant/:tenantId')
    @ApiOperation({
        summary: 'Get features for a tenant (Internal API for UAM service)',
        description: 'Returns simplified feature list based on tenant\'s active subscriptions. Used by UAM service for permission assignment.',
    })
    @ApiParam({
        name: 'tenantId',
        description: 'Tenant UUID',
        example: '9f5c880c-8aa6-4127-9a7d-757ebd11c5cd',
    })
    @ApiResponse({
        status: 200,
        description: 'Features retrieved successfully',
        type: TenantFeaturesResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'No active subscriptions found for tenant',
    })
    async getTenantFeatures(
        @Param('tenantId') tenantId: string,
    ): Promise<TenantFeaturesResponseDto> {
        return this.getTenantFeaturesUseCase.execute(tenantId);
    }
}
