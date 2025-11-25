import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateSubscriptionDto {
    @ApiProperty({ format: 'uuid', description: 'Tenant that owns the subscription' })
    @IsUUID()
    tenantId: string;

    @ApiProperty({ format: 'uuid', description: 'Billing account for this subscription' })
    @IsUUID()
    accountId: string;

    @ApiProperty({ format: 'uuid', description: 'Plan to subscribe to' })
    @IsUUID()
    planId: string;

    @ApiPropertyOptional({ type: Object, description: 'Additional metadata for the subscription' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}


