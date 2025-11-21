import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePlanDto } from '@application/dtos/create-plan.dto';
import { PlanResponseDto } from '@application/dtos/plan-response.dto';
import { CreatePlanUseCase } from '@application/use-cases/plans/create-plan.use-case';
import { GetPlanUseCase } from '@application/use-cases/plans/get-plan.use-case';

@ApiTags('plans')
@Controller('api/plans')
export class PlansController {
    constructor(
        private readonly createPlanUseCase: CreatePlanUseCase,
        private readonly getPlanUseCase: GetPlanUseCase,
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
}
