import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({
        description: 'Product name',
        example: 'API Platform',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Product description',
        example: 'Full API access with advanced features',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Additional metadata for the product',
        example: { category: 'api', tier: 'enterprise' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
