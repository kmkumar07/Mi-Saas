import { IsUUID, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordUsageDto {
    @ApiProperty({
        description: 'Tenant UUID',
        example: 'eca56dfd-6911-4bb7-ade6-38841a93f875',
    })
    @IsUUID()
    tenantId: string;

    @ApiPropertyOptional({
        description: 'Customer UUID (optional - can track usage at tenant level)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiProperty({
        description: 'Feature code (case-insensitive, will be converted to lowercase)',
        example: 'ATTACHMENTS_MB',
    })
    @IsString()
    featureCode: string;

    @ApiProperty({
        description: 'Usage quantity (must be a positive integer)',
        example: 5,
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    usage: number;

    @ApiPropertyOptional({
        description: 'Idempotency key to prevent duplicate usage recording. If provided and a usage event with the same key already exists, the existing event is returned instead of creating a duplicate. Useful for retry scenarios to prevent double-counting.',
        example: 'unique-idempotency-key-123',
    })
    @IsOptional()
    @IsString()
    idempotencyKey?: string;
}

export interface FeaturePricingTierInfo {
    fromQuantity: number;
    toQuantity?: number | null;
    pricePerUnit: number;
    currency: string;
}

export interface FeatureEntitlement {
    enabled: boolean;
    limit?: number;
    /**
     * Tiered pricing information for metered features, if applicable.
     */
    pricingTiers?: FeaturePricingTierInfo[];
}

export interface UsageInfo {
    used: number;
    limit?: number;
}

/**
 * Usage entry with used and limit values
 */
export class UsageEntryDto {
    @ApiProperty({ description: 'Current usage amount', example: 450 })
    used: number;

    @ApiProperty({ description: 'Usage limit', example: 500 })
    limit: number;
}

// Keep interface for internal use
export interface UsageEntry {
    used: number;
    limit: number;
}

/**
 * Response for recording usage
 */
export class RecordUsageResponseDto {
    @ApiProperty({
        description: 'Feature code',
        example: 'ATTACHMENTS_MB',
    })
    featureCode: string;

    @ApiProperty({
        description: 'Usage that was recorded',
        example: 5,
    })
    usage: number;

    @ApiProperty({
        description: 'Total usage after recording',
        example: 455,
    })
    totalUsed: number;

    @ApiProperty({
        description: 'Usage limit (null if unlimited)',
        example: 500,
        nullable: true,
    })
    limit: number | null;

    @ApiProperty({
        description: 'Whether the limit was exceeded',
        example: false,
    })
    limitExceeded: boolean;

    @ApiProperty({
        description: 'Remaining usage (null if unlimited)',
        example: 45,
        nullable: true,
    })
    remaining: number | null;
}

/**
 * Entitlements response with simplified structure:
 * - features: Record of feature codes to boolean (enabled/disabled)
 * - usage: Record of feature codes to usage information (used and limit)
 */
export class EntitlementsResponseDto {
    @ApiProperty({
        description: 'Feature entitlements - feature codes mapped to enabled/disabled status',
        example: {
            ATTACHMENTS: true,
            TAGS: false,
            AI_TODO: true,
        },
        type: Object,
    })
    features: Record<string, boolean>;

    @ApiProperty({
        description: 'Usage information - feature codes mapped to usage data',
        example: {
            ATTACHMENTS_MB: { used: 450, limit: 500 },
            AI_TODO_CALLS: { used: 3, limit: 10 },
        },
        type: Object,
    })
    usage: Record<string, UsageEntry>;
}
