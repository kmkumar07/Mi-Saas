import { IsUUID, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class RecordUsageDto {
    @IsUUID()
    tenantId: string;

    @IsUUID()
    customerId: string;

    @IsString()
    featureCode: string;

    @IsInt()
    @Min(1)
    quantity: number;

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

export class EntitlementsResponseDto {
    features: Record<string, FeatureEntitlement>;
    usage: Record<string, UsageInfo>;
}
