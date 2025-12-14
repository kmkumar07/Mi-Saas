import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivateTenantPlanUseCase } from '../../application/use-cases/tenant-activation/activate-tenant-plan.use-case';

export class ActivateTenantPlanDto {
    tenantId: string;
    productIds: string[];
    featureIds: string[];
    roleCode: string;
    roleName: string;
}

export class ActivateTenantPlanResponseDto {
    success: boolean;
    organizationMemberId: string;
    roleId: string;
    roleCode: string;
    permissionsCreated: number;
    grantsCreated: number;
    grantsSkipped: number;
}

/**
 * Tenant Activation Controller
 * Internal endpoint for tenant plan activation
 * This endpoint is called by ss-backend after payment completion
 */
@ApiTags('Tenant Activation')
@Controller('api/internal/tenant-activation')
export class TenantActivationController {
    constructor(
        private readonly activateTenantPlanUseCase: ActivateTenantPlanUseCase,
    ) { }

    @Post('activate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Activate tenant plan - creates admin role, permissions, and product access' })
    @ApiResponse({
        status: 200,
        description: 'Tenant plan activated successfully',
        type: ActivateTenantPlanResponseDto,
    })
    async activateTenantPlan(
        @Body() dto: ActivateTenantPlanDto,
    ): Promise<ActivateTenantPlanResponseDto> {
        const result = await this.activateTenantPlanUseCase.execute({
            tenantId: dto.tenantId,
            productIds: dto.productIds,
            featureIds: dto.featureIds,
            roleCode: dto.roleCode,
            roleName: dto.roleName,
        });

        return {
            success: result.success,
            organizationMemberId: result.organizationMemberId,
            roleId: result.roleId,
            roleCode: result.roleCode,
            permissionsCreated: result.permissionsCreated,
            grantsCreated: result.grantsCreated,
            grantsSkipped: result.grantsSkipped,
        };
    }
}

