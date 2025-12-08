import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType, FeatureType, ChargeModel, ChargeFrequency } from '@domain/enums';

/**
 * Feature pricing tier response DTO
 */
export class FeaturePricingTierResponseDto {
  @ApiPropertyOptional({ example: 'uuid' })
  id?: string;

  @ApiProperty({ example: 0 })
  fromQuantity: number;

  @ApiPropertyOptional({ example: 1000 })
  toQuantity?: number | null;

  @ApiProperty({ example: 100 })
  pricePerUnit: number;

  @ApiProperty({ example: 'INR' })
  currency: string;
}

/**
 * Plan feature configuration response DTO
 */
export class PlanFeatureConfigResponseDto {
  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Quota limit for QUOTA type features' })
  quotaLimit?: number;

  @ApiPropertyOptional({ 
    type: [FeaturePricingTierResponseDto],
    description: 'Pricing tiers for METERED type features'
  })
  pricingTiers?: FeaturePricingTierResponseDto[];
}

/**
 * Feature response DTO
 */
export class FeatureResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'API Calls' })
  name: string;

  @ApiProperty({ example: 'api_calls' })
  code: string;

  @ApiPropertyOptional({ example: 'Track API usage' })
  description?: string;

  @ApiProperty({ enum: FeatureType, example: FeatureType.METERED })
  featureType: FeatureType;

  @ApiProperty({ enum: ChargeModel, example: ChargeModel.PER_API_CALL })
  chargeModel: ChargeModel;

  @ApiPropertyOptional({ example: 'https://api.example.com/track' })
  serviceUrl?: string;

  @ApiPropertyOptional({ 
    type: PlanFeatureConfigResponseDto,
    description: 'Plan-specific feature configuration (quota limits, pricing tiers, etc.)'
  })
  planFeatureConfig?: PlanFeatureConfigResponseDto;
}

/**
 * Product response DTO
 */
export class ProductResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'API Platform' })
  name: string;

  @ApiPropertyOptional({ example: 'Full API access' })
  description?: string;

  @ApiProperty({ type: [FeatureResponseDto] })
  features: FeatureResponseDto[];
}

/**
 * Recurring charge period response DTO
 */
export class RecurringChargePeriodResponseDto {
  @ApiProperty({ example: 'rcp_123' })
  recurringChargePeriodId: string;

  @ApiProperty({ enum: ChargeFrequency, example: ChargeFrequency.MONTHLY })
  chargeFrequency: ChargeFrequency;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  startDateTime: Date;

  @ApiPropertyOptional({ example: 12 })
  numberOfPeriods?: number;
}

/**
 * Price response DTO
 */
export class PriceResponseDto {
  @ApiProperty({ example: 'price_123' })
  priceId: string;

  @ApiProperty({ example: 9900 })
  value: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Monthly subscription' })
  description?: string;

  @ApiProperty({ type: RecurringChargePeriodResponseDto })
  recurringChargePeriod: RecurringChargePeriodResponseDto;
}

/**
 * Time period response DTO
 */
export class TimePeriodResponseDto {
  @ApiProperty({ example: 'tp_123' })
  timePeriodId: string;

  @ApiProperty({ example: 'month' })
  name: string;

  @ApiProperty({ example: 1 })
  value: number;
}

/**
 * Renewal definition response DTO
 */
export class RenewalDefinitionResponseDto {
  @ApiProperty({ example: false })
  isExpirable: boolean;

  @ApiProperty({ example: true })
  isAutomaticRenewable: boolean;

  @ApiProperty({ example: 'month' })
  renewCycleUnits: string;

  @ApiProperty({ type: TimePeriodResponseDto })
  gracePeriod: TimePeriodResponseDto;

  @ApiProperty({ example: 12 })
  maxRenewCycles: number;
}

/**
 * Plan response DTO
 */
export class PlanResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Premium Plan' })
  name: string;

  @ApiProperty({ example: 'PREMIUM_PLAN', description: 'Plan code for versioning (groups plan versions)' })
  planCode: string;

  @ApiProperty({ enum: PlanType, example: PlanType.PRO })
  planType: PlanType;

  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty({ type: PriceResponseDto })
  price: PriceResponseDto;

  @ApiPropertyOptional({ type: RenewalDefinitionResponseDto })
  renewalDefinition?: RenewalDefinitionResponseDto;

  @ApiPropertyOptional({ type: TimePeriodResponseDto })
  trialPeriod?: TimePeriodResponseDto;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ 
    enum: ['active', 'archived', 'draft', 'published'], 
    example: 'draft',
    description: 'Plan status: draft (not yet published), published (immutable, available for subscriptions), active (available for new subscriptions), archived (no longer available)'
  })
  status: 'active' | 'archived' | 'draft' | 'published';

  @ApiProperty({ 
    example: 1,
    description: 'Plan version number within its family. Increments when a new version is created.'
  })
  version: number;

  @ApiPropertyOptional({ example: { customField: 'value' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;
}
