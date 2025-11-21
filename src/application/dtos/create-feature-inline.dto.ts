import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
}
