import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for configuring a feature in a plan
 * This includes the feature ID and the plan-specific values (quota, pricing tiers, etc.)
 */
export class PlanFeatureConfigDto {
    @ApiProperty({
        description: 'Feature ID to include in this plan',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsString()
    featureId: string;

    @ApiPropertyOptional({
        description: 'Whether this feature is active for the plan (defaults to true)',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Quota limit for QUOTA features (per billing period)',
        example: 10000,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    quotaLimit?: number;

    @ApiPropertyOptional({
        description: 'Tiered pricing configuration for METERED features',
        type: () => [FeaturePricingTierDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FeaturePricingTierDto)
    pricingTiers?: FeaturePricingTierDto[];
}

export class FeaturePricingTierDto {
    @ApiProperty({
        description: 'Inclusive start quantity for this tier',
        example: 0,
    })
    @IsInt()
    @Min(0)
    fromQuantity: number;

    @ApiPropertyOptional({
        description: 'Inclusive end quantity for this tier (null for open-ended)',
        example: 1000,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    toQuantity?: number;

    @ApiProperty({
        description: 'Price per unit in minor currency units (e.g., cents)',
        example: 10,
    })
    @IsInt()
    @Min(1)
    pricePerUnit: number;

    @ApiPropertyOptional({
        description: '3-letter ISO currency code (defaults to plan currency if omitted)',
        example: 'USD',
    })
    @IsOptional()
    @IsString()
    currency?: string;
}

