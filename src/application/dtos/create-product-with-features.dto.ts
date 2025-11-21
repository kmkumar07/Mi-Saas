import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateFeatureInlineDto } from './create-feature-inline.dto';

/**
 * DTO for creating a product with features
 */
export class CreateProductWithFeaturesDto {
    @ApiProperty({
        description: 'Product name',
        example: 'API Platform',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Product description',
        example: 'Full API access',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Features included in this product',
        type: [CreateFeatureInlineDto],
        example: [
            {
                name: 'API Calls',
                code: 'api_calls',
                description: 'Track API usage',
                featureType: 'metered',
                chargeModel: 'per_api_call',
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFeatureInlineDto)
    features: CreateFeatureInlineDto[];
}
