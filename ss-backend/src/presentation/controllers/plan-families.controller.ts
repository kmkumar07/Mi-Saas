import { Controller, Post, Get, Put, Delete, Body, Param, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreatePlanFamilyDto } from '@application/dtos/create-plan-family.dto';
import { UpdatePlanFamilyDto } from '@application/dtos/update-plan-family.dto';
import { PlanFamilyResponseDto } from '@application/dtos/plan-family-response.dto';
import { CreatePlanFamilyUseCase } from '@application/use-cases/plan-families/create-plan-family.use-case';
import { GetPlanFamilyUseCase } from '@application/use-cases/plan-families/get-plan-family.use-case';
import { UpdatePlanFamilyUseCase } from '@application/use-cases/plan-families/update-plan-family.use-case';
import { DeletePlanFamilyUseCase } from '@application/use-cases/plan-families/delete-plan-family.use-case';
import { ListPlanFamiliesUseCase } from '@application/use-cases/plan-families/list-plan-families.use-case';

@ApiTags('plan-families')
@Controller('api/plan-families')
export class PlanFamiliesController {
    constructor(
        private readonly createPlanFamilyUseCase: CreatePlanFamilyUseCase,
        private readonly getPlanFamilyUseCase: GetPlanFamilyUseCase,
        private readonly updatePlanFamilyUseCase: UpdatePlanFamilyUseCase,
        private readonly deletePlanFamilyUseCase: DeletePlanFamilyUseCase,
        private readonly listPlanFamiliesUseCase: ListPlanFamiliesUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new plan family' })
    @ApiResponse({ status: 201, description: 'Plan family created successfully', type: PlanFamilyResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid input or plan code already exists' })
    async create(@Body() createPlanFamilyDto: CreatePlanFamilyDto): Promise<PlanFamilyResponseDto> {
        return await this.createPlanFamilyUseCase.execute(createPlanFamilyDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get plan family by ID' })
    @ApiParam({ name: 'id', description: 'Plan family ID' })
    @ApiResponse({ status: 200, description: 'Plan family found', type: PlanFamilyResponseDto })
    @ApiResponse({ status: 404, description: 'Plan family not found' })
    async getById(@Param('id') id: string): Promise<PlanFamilyResponseDto> {
        return await this.getPlanFamilyUseCase.execute(id);
    }

    @Get()
    @ApiOperation({ summary: 'List plan families' })
    @ApiResponse({ status: 200, description: 'List of plan families', type: [PlanFamilyResponseDto] })
    async list(): Promise<PlanFamilyResponseDto[]> {
        return await this.listPlanFamiliesUseCase.execute();
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update plan family' })
    @ApiParam({ name: 'id', description: 'Plan family ID' })
    @ApiResponse({ status: 200, description: 'Plan family updated successfully', type: PlanFamilyResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid input or plan code already exists' })
    @ApiResponse({ status: 404, description: 'Plan family not found' })
    async update(
        @Param('id') id: string,
        @Body() updatePlanFamilyDto: UpdatePlanFamilyDto,
    ): Promise<PlanFamilyResponseDto> {
        return await this.updatePlanFamilyUseCase.execute(id, updatePlanFamilyDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete plan family' })
    @ApiParam({ name: 'id', description: 'Plan family ID' })
    @ApiResponse({ status: 204, description: 'Plan family deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete plan family with associated plans' })
    @ApiResponse({ status: 404, description: 'Plan family not found' })
    async delete(@Param('id') id: string): Promise<void> {
        return await this.deletePlanFamilyUseCase.execute(id);
    }
}

