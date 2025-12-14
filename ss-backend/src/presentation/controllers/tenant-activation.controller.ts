import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivateTenantPlanUseCase } from '../../application/use-cases/tenant-activation/activate-tenant-plan.use-case';
import { ActivateTenantPlanDto, ActivateTenantPlanResponseDto } from '../../application/dtos/tenant-activation/activate-tenant-plan.dto';

@ApiTags('Tenant Activation')
@Controller('api/tenant-activation')
export class TenantActivationController {
    constructor(
        private readonly activateTenantPlanUseCase: ActivateTenantPlanUseCase,
    ) { }

    @Post('activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Activate tenant plan after payment completion' })
    @ApiResponse({
        status: 200,
        description: 'Tenant plan activated successfully',
        type: ActivateTenantPlanResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Subscription, plan, or organization admin not found',
    })
    async activateTenantPlan(
        @Body() dto: ActivateTenantPlanDto,
    ): Promise<ActivateTenantPlanResponseDto> {
        return this.activateTenantPlanUseCase.execute(dto);
    }
}

