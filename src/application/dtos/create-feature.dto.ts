import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeModel, FeatureType, MeterType } from '@domain/enums';

export class CreateFeatureDto {
    @ApiProperty({
        description: 'Product ID that this feature belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({
        description: 'Feature name',
        example: 'API Calls',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Unique feature code',
        example: 'api_calls',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiPropertyOptional({
        description: 'Feature description',
        example: 'Track and charge for API calls',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Type of feature',
        enum: FeatureType,
        example: FeatureType.METERED,
    })
    @IsEnum(FeatureType)
    featureType: FeatureType;

    @ApiProperty({
        description: 'Charge model for this feature',
        enum: ChargeModel,
        example: ChargeModel.PER_API_CALL,
    })
    @IsEnum(ChargeModel)
    chargeModel: ChargeModel;

    @ApiPropertyOptional({
        description: 'Meter type for metered features',
        enum: MeterType,
        example: MeterType.API_CALL,
    })
    @IsEnum(MeterType)
    @IsOptional()
    meterType?: MeterType;

    @ApiPropertyOptional({
        description: 'Service URL for feature integration',
        example: 'https://api.example.com/track',
    })
    @IsString()
    @IsOptional()
    serviceUrl?: string;

    @ApiPropertyOptional({
        description: 'Additional metadata for the feature',
        example: { rateLimit: 1000, unit: 'requests' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
