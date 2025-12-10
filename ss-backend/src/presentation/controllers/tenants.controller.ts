import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateTenantUseCase } from '@application/use-cases/tenants/create-tenant.use-case';
import { GetTenantUseCase } from '@application/use-cases/tenants/get-tenant.use-case';
import { GetAllTenantsUseCase } from '@application/use-cases/tenants/get-all-tenants.use-case';
import { GetTenantDashboardUseCase } from '@application/use-cases/tenants/get-tenant-dashboard.use-case';
import { CreateTenantDto } from '@application/dtos/create-tenant.dto';
import { TenantResponseDto } from '@application/dtos/tenant-response.dto';
import { TenantDashboardDto } from '@application/dtos/tenant-dashboard.dto';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
    constructor(
        private readonly createTenantUseCase: CreateTenantUseCase,
        private readonly getTenantUseCase: GetTenantUseCase,
        private readonly getAllTenantsUseCase: GetAllTenantsUseCase,
        private readonly getTenantDashboardUseCase: GetTenantDashboardUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new tenant' })
    @ApiResponse({
        status: 201,
        description: 'Tenant created successfully',
        type: TenantResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
        return this.createTenantUseCase.execute(createTenantDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tenants' })
    @ApiResponse({
        status: 200,
        description: 'List of all tenants',
        type: [TenantResponseDto],
    })
    async findAll(): Promise<TenantResponseDto[]> {
        return this.getAllTenantsUseCase.execute();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tenant by ID' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({
        status: 200,
        description: 'Tenant found',
        type: TenantResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Tenant not found' })
    async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
        return this.getTenantUseCase.execute(id);
    }

    @Get(':id/dashboard')
    @ApiOperation({ summary: 'Get tenant dashboard with subscriptions, plans, and usage' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard data retrieved successfully',
        type: TenantDashboardDto,
    })
    @ApiResponse({ status: 404, description: 'Tenant not found' })
    async getDashboard(@Param('id') id: string): Promise<TenantDashboardDto> {
        return this.getTenantDashboardUseCase.execute(id);
    }
}
