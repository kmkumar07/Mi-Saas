import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpgradeSubscriptionDto {
    @ApiProperty({ format: 'uuid', description: 'Subscription ID to upgrade' })
    @IsUUID()
    subscriptionId: string;

    @ApiProperty({ format: 'uuid', description: 'New plan ID to upgrade to' })
    @IsUUID()
    newPlanId: string;
}

export class UpgradeSubscriptionResponseDto {
    @ApiProperty({ format: 'uuid' })
    oldSubscriptionId: string;

    @ApiProperty({ format: 'uuid' })
    newSubscriptionId: string;

    @ApiProperty()
    proratedAmount: number;

    @ApiProperty()
    currency: string;

    @ApiProperty()
    daysRemaining: number;

    @ApiProperty()
    daysInPeriod: number;

    @ApiProperty()
    proratedCredit: number;

    @ApiProperty()
    currentPlanCost: number;

    @ApiProperty()
    newPlanCost: number;
}

