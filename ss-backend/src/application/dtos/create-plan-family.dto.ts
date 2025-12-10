import { IsNotEmpty, IsString, IsOptional, IsObject, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a plan family
 */
export class CreatePlanFamilyDto {
    @ApiProperty({
        description: 'Plan family name',
        example: 'Premium Plan Family',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Plan code (unique identifier for the plan family)',
        example: 'PREMIUM',
    })
    @IsNotEmpty()
    @IsString()
    planCode: string;

    @ApiPropertyOptional({
        description: 'Rank for ordering plan families (higher rank = higher tier). Used for upgrade/downgrade logic.',
        example: 3,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    rank?: number;

    @ApiPropertyOptional({
        description: 'Additional metadata',
        example: { description: 'Premium tier plans' },
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

