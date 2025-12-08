import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreatePlanDto } from '@application/dtos/create-plan.dto';
import { UpdatePlanDto } from '@application/dtos/update-plan.dto';
import { PlanResponseDto } from '@application/dtos/plan-response.dto';
import { CreatePlanUseCase } from '@application/use-cases/plans/create-plan.use-case';
import { GetPlanUseCase } from '@application/use-cases/plans/get-plan.use-case';
import { UpdatePlanUseCase } from '@application/use-cases/plans/update-plan.use-case';
import { PublishPlanUseCase } from '@application/use-cases/plans/publish-plan.use-case';
import { GetPlansByFamilyUseCase } from '@application/use-cases/plans/get-plans-by-family.use-case';

@ApiTags('plans')
@Controller('api/plans')
export class PlansController {
    constructor(
        private readonly createPlanUseCase: CreatePlanUseCase,
        private readonly getPlanUseCase: GetPlanUseCase,
        private readonly updatePlanUseCase: UpdatePlanUseCase,
        private readonly publishPlanUseCase: PublishPlanUseCase,
        private readonly getPlansByFamilyUseCase: GetPlansByFamilyUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new plan' })
    @ApiResponse({ status: 201, description: 'Plan created successfully', type: PlanResponseDto })
    async create(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
        return await this.createPlanUseCase.execute(createPlanDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get plans by family ID' })
    @ApiQuery({ name: 'familyId', required: false, description: 'Filter plans by plan family ID' })
    @ApiResponse({ status: 200, description: 'Plans found', type: [PlanResponseDto] })
    async getPlans(@Query('familyId') familyId?: string): Promise<PlanResponseDto[]> {
        if (familyId) {
            return await this.getPlansByFamilyUseCase.execute(familyId);
        }
        return [];
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get plan by ID' })
    @ApiResponse({ status: 200, description: 'Plan found', type: PlanResponseDto })
    @ApiResponse({ status: 404, description: 'Plan not found' })
    async getById(@Param('id') id: string): Promise<PlanResponseDto> {
        return await this.getPlanUseCase.execute(id);
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update plan' })
    @ApiResponse({ status: 200, description: 'Plan updated successfully', type: PlanResponseDto })
    @ApiResponse({ status: 404, description: 'Plan not found' })
    async update(
        @Param('id') id: string,
        @Body() updatePlanDto: UpdatePlanDto,
    ): Promise<PlanResponseDto> {
        return await this.updatePlanUseCase.execute(id, updatePlanDto);
    }

    @Post(':id/publish')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Publish a plan' })
    @ApiResponse({ status: 200, description: 'Plan published successfully', type: PlanResponseDto })
    @ApiResponse({ status: 404, description: 'Plan not found' })
    @ApiResponse({ status: 400, description: 'Plan cannot be published (already published or archived)' })
    async publish(@Param('id') id: string): Promise<PlanResponseDto> {
        return await this.publishPlanUseCase.execute(id);
    }
}
