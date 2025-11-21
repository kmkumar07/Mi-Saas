import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateProductDto } from '@application/dtos/create-product.dto';
import { CreateProductUseCase } from '@application/use-cases/products/create-product.use-case';
import { Product } from '@domain/entities';

@ApiTags('products')
@Controller('api/products')
export class ProductsController {
    constructor(
        private readonly createProductUseCase: CreateProductUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
        return await this.createProductUseCase.execute(createProductDto);
    }
}
