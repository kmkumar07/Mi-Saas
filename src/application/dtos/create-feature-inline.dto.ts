import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeatureType, ChargeModel } from '@domain/enums';

/**
 * DTO for creating a feature inline within product creation
 */
export class CreateFeatureInlineDto {
    @ApiProperty({
        description: 'Feature name',
        example: 'API Calls',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Unique feature code',
        example: 'api_calls',
    })
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiPropertyOptional({
        description: 'Feature description',
        example: 'Track API usage',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Type of feature',
        enum: FeatureType,
        example: FeatureType.METERED,
    })
    @IsNotEmpty()
    @IsEnum(FeatureType)
    featureType: FeatureType;

    @ApiProperty({
        description: 'Charge model for the feature',
        enum: ChargeModel,
        example: ChargeModel.PER_API_CALL,
    })
    @IsNotEmpty()
    @IsEnum(ChargeModel)
    chargeModel: ChargeModel;

    @ApiPropertyOptional({
        description: 'Service URL for the feature',
        example: 'https://api.example.com/track',
    })
    @IsOptional()
    @IsString()
    serviceUrl?: string;

    @ApiPropertyOptional({
        description: 'Whether this feature is active for the plan (defaults to true)',
        example: true,
    })
    @IsOptional()
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
