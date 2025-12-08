import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for plan family response
 */
export class PlanFamilyResponseDto {
    @ApiProperty({
        description: 'Plan family ID',
        example: 'uuid',
    })
    id: string;

    @ApiProperty({
        description: 'Plan family name',
        example: 'Premium Plan Family',
    })
    name: string;

    @ApiProperty({
        description: 'Plan code',
        example: 'PREMIUM',
    })
    planCode: string;

    @ApiProperty({
        description: 'Rank for ordering plan families (higher rank = higher tier). Used for upgrade/downgrade logic.',
        example: 3,
    })
    rank: number;

    @ApiPropertyOptional({
        description: 'Metadata',
        example: { description: 'Premium tier plans' },
    })
    metadata?: Record<string, any>;

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2025-01-01T00:00:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2025-01-01T00:00:00Z',
    })
    updatedAt: Date;
}

