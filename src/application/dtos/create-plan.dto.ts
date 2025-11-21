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
import { CreateProductWithFeaturesDto } from './create-product-with-features.dto';
import { PriceDto } from './price.dto';
import { RenewalDefinitionDto } from './renewal-definition.dto';
import { TimePeriodDto } from './time-period.dto';

/**
 * DTO for creating a plan with products, features, pricing, and renewal configuration
 */
export class CreatePlanDto {
    @ApiProperty({
        description: 'Tenant ID',
        example: 'tenant-uuid',
    })
    @IsNotEmpty()
    @IsString()
    tenantId: string;

    @ApiProperty({
        description: 'Products with features to include in this plan',
        type: [CreateProductWithFeaturesDto],
        example: [
            {
                name: 'API Platform',
                description: 'Full API access',
                features: [
                    {
                        name: 'API Calls',
                        code: 'api_calls',
                        description: 'Track API usage',
                        featureType: 'metered',
                        chargeModel: 'per_api_call',
                    },
                ],
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductWithFeaturesDto)
    products: CreateProductWithFeaturesDto[];

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
}
