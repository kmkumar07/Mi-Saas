import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanResponseDto } from './plan-response.dto';
import { SubscriptionResponseDto } from './subscription-response.dto';

export class FeatureUsageDto {
    @ApiProperty()
    featureId: string;

    @ApiProperty()
    featureName: string;

    @ApiProperty()
    featureCode: string;

    @ApiPropertyOptional()
    featureDescription?: string;

    @ApiProperty()
    used: number;

    @ApiPropertyOptional()
    limit?: number;

    @ApiProperty()
    isUnlimited: boolean;

    @ApiProperty()
    featureType: string;
}

export class TenantDashboardDto {
    @ApiProperty({ format: 'uuid' })
    tenantId: string;

    @ApiProperty()
    tenantName: string;

    @ApiProperty({ type: [SubscriptionResponseDto] })
    subscriptions: SubscriptionResponseDto[];

    @ApiProperty({ type: [PlanResponseDto] })
    plans: PlanResponseDto[];

    @ApiProperty({ type: [FeatureUsageDto] })
    featureUsage: FeatureUsageDto[];

    @ApiProperty()
    totalFeatures: number;

    @ApiProperty()
    activeSubscriptions: number;
}

