import {
    IsNotEmpty,
    IsString,
    IsEnum,
    IsArray,
    IsOptional,
    ValidateNested,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '@domain/enums';
import { PriceDto } from './price.dto';
import { RenewalDefinitionDto } from './renewal-definition.dto';
import { TimePeriodDto } from './time-period.dto';
import { PlanFeatureConfigDto } from './plan-feature-config.dto';

/**
 * DTO for creating a plan with existing products and features
 * Products and features should be created separately before creating a plan
 */
export class CreatePlanDto {
    @ApiProperty({
        description: 'Plan family ID (required)',
        example: 'plan-family-uuid',
    })
    @IsNotEmpty()
    @IsString()
    planFamilyId: string;

    @ApiProperty({
        description: 'Product IDs to include in this plan',
        type: [String],
        example: ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'],
    })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    productIds: string[];

    @ApiProperty({
        description: 'Feature configurations for this plan (selective features with their values)',
        type: [PlanFeatureConfigDto],
        example: [
            {
                featureId: '770e8400-e29b-41d4-a716-446655440002',
                isActive: true,
                quotaLimit: 10000,
            },
            {
                featureId: '880e8400-e29b-41d4-a716-446655440003',
                isActive: true,
                pricingTiers: [
                    {
                        fromQuantity: 0,
                        toQuantity: 1000,
                        pricePerUnit: 10,
                        currency: 'USD',
                    },
                ],
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlanFeatureConfigDto)
    featureConfigs: PlanFeatureConfigDto[];

    @ApiProperty({
        description: 'Plan name',
        example: 'Premium Plan',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Type of plan',
        enum: PlanType,
        example: PlanType.PRO,
    })
    @IsNotEmpty()
    @IsEnum(PlanType)
    planType: PlanType;

    @ApiProperty({
        description: 'Price configuration with recurring charge period',
        type: PriceDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => PriceDto)
    price: PriceDto;

    @ApiPropertyOptional({
        description: 'Renewal definition (optional)',
        type: RenewalDefinitionDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => RenewalDefinitionDto)
    renewalDefinition?: RenewalDefinitionDto;

    @ApiPropertyOptional({
        description: 'Trial period (optional)',
        type: TimePeriodDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => TimePeriodDto)
    trialPeriod?: TimePeriodDto;

    @ApiPropertyOptional({
        description: 'Additional metadata',
        example: { customField: 'value' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Plan status (defaults to draft)',
        enum: ['draft', 'published', 'active', 'archived'],
        example: 'draft',
    })
    @IsOptional()
    @IsEnum(['draft', 'published', 'active', 'archived'])
    status?: 'draft' | 'published' | 'active' | 'archived';
}
