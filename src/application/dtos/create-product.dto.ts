import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PricingStrategy } from '@domain/enums';

export class CreateProductDto {
    @ApiProperty({
        description: 'Tenant ID for multi-tenant isolation',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    @IsNotEmpty()
    tenantId: string;

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

    @ApiProperty({
        description: 'Pricing strategy for the product',
        enum: PricingStrategy,
        example: PricingStrategy.METERED,
    })
    @IsEnum(PricingStrategy)
    pricingStrategy: PricingStrategy;

    @ApiPropertyOptional({
        description: 'Additional metadata for the product',
        example: { category: 'api', tier: 'enterprise' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
