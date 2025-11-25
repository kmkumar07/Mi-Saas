import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePlanDto } from '@application/dtos/create-plan.dto';
import { UpdatePlanDto } from '@application/dtos/update-plan.dto';
import { PlanResponseDto } from '@application/dtos/plan-response.dto';
import { CreatePlanUseCase } from '@application/use-cases/plans/create-plan.use-case';
import { GetPlanUseCase } from '@application/use-cases/plans/get-plan.use-case';
import { UpdatePlanUseCase } from '@application/use-cases/plans/update-plan.use-case';

@ApiTags('plans')
@Controller('api/plans')
export class PlansController {
    constructor(
        private readonly createPlanUseCase: CreatePlanUseCase,
        private readonly getPlanUseCase: GetPlanUseCase,
        private readonly updatePlanUseCase: UpdatePlanUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new plan' })
    @ApiResponse({ status: 201, description: 'Plan created successfully', type: PlanResponseDto })
    async create(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
        return await this.createPlanUseCase.execute(createPlanDto);
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
}
