import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateFeatureDto } from '@application/dtos/create-feature.dto';
import { CreateFeatureUseCase } from '@application/use-cases/features/create-feature.use-case';
import { Feature } from '@domain/entities';

@ApiTags('features')
@Controller('api/features')
export class FeaturesController {
    constructor(
        private readonly createFeatureUseCase: CreateFeatureUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new feature' })
    @ApiResponse({ status: 201, description: 'Feature created successfully' })
    async create(@Body() createFeatureDto: CreateFeatureDto): Promise<Feature> {
        return await this.createFeatureUseCase.execute(createFeatureDto);
    }
}
