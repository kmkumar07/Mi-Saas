import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ format: 'uuid' })
    accountId: string;

    @ApiProperty({ format: 'uuid' })
    tenantId: string;

    @ApiProperty({ format: 'uuid' })
    customerId: string;

    @ApiProperty({ format: 'uuid' })
    planId: string;

    @ApiProperty({
        enum: ['active', 'trial', 'past_due', 'cancelled', 'incomplete', 'expired'],
    })
    status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'incomplete' | 'expired';

    @ApiProperty()
    seats: number;

    @ApiProperty()
    currentPeriodStart: Date;

    @ApiProperty()
    currentPeriodEnd: Date;

    @ApiPropertyOptional()
    cancelledAt?: Date;

    @ApiPropertyOptional()
    cancellationReason?: string;

    @ApiPropertyOptional({ type: Object })
    metadata?: Record<string, any>;

    @ApiProperty()
    createdAt: Date;
}


