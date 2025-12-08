import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsArray, ValidateNested, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ChargeModel } from '@domain/enums';

/**
 * Base DTO for pricing models
 */
export class PricingModelDto {
    @ApiProperty({
        description: 'Type of pricing model',
        enum: ChargeModel,
        example: ChargeModel.PER_USAGE,
    })
    @IsNotEmpty()
    @IsEnum(ChargeModel)
    type: ChargeModel;

    @ApiProperty({
        description: 'Currency code (3-letter ISO)',
        example: 'USD',
    })
    @IsNotEmpty()
    @IsString()
    currency: string;

    @ApiPropertyOptional({
        description: 'Additional details',
    })
    @IsOptional()
    @IsObject()
    details?: Record<string, any>;

    // Per-user pricing fields
    @ApiPropertyOptional({
        description: 'Price per user (for per_user type)',
        example: 1500,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    pricePerUser?: number;

    @ApiPropertyOptional({
        description: 'Minimum users (for per_user type)',
        example: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    minUsers?: number;

    // Per-usage pricing fields
    @ApiPropertyOptional({
        description: 'Price per unit (for per_usage type)',
        example: 2,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    pricePerUnit?: number;

    @ApiPropertyOptional({
        description: 'Unit name (for per_usage, tiered, volume, graduated types)',
        example: 'api_call',
    })
    @IsOptional()
    @IsString()
    unitName?: string;

    // Tiered/Graduated pricing fields
    @ApiPropertyOptional({
        description: 'Tiers for tiered or graduated pricing',
        type: () => [PricingTierDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PricingTierDto)
    tiers?: PricingTierDto[];

    // Volume pricing fields
    @ApiPropertyOptional({
        description: 'Volumes for volume pricing',
        type: () => [VolumePricingDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VolumePricingDto)
    volumes?: VolumePricingDto[];
}

export class PricingTierDto {
    @ApiProperty({
        description: 'Inclusive start quantity for this tier',
        example: 1,
    })
    @IsInt()
    @Min(0)
    from: number;

    @ApiPropertyOptional({
        description: 'Inclusive end quantity for this tier (null for open-ended)',
        example: 1000,
    })
    @IsOptional()
    to?: number | null;

    @ApiProperty({
        description: 'Price per unit in minor currency units (e.g., cents)',
        example: 5,
    })
    @IsInt()
    @Min(1)
    price_per_unit: number;
}

export class VolumePricingDto {
    @ApiPropertyOptional({
        description: 'Maximum volume for this bracket (null for open-ended)',
        example: 10000,
    })
    @IsOptional()
    max_volume?: number | null;

    @ApiProperty({
        description: 'Price per unit in minor currency units (e.g., cents)',
        example: 4,
    })
    @IsInt()
    @Min(1)
    price_per_unit: number;
}

// Legacy DTO for backward compatibility
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

/**
 * DTO for configuring a feature in a plan
 * This includes the feature ID and the plan-specific values (quota, pricing model, etc.)
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
        description: 'Pricing model configuration for METERED features',
        type: () => PricingModelDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => PricingModelDto)
    pricingModel?: PricingModelDto;
}

