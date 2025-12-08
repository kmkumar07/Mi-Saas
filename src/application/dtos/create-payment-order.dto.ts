import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentOrderDto {
    @ApiProperty({ format: 'uuid', description: 'Tenant that owns the payment order' })
    @IsUUID()
    tenantId: string;

    @ApiProperty({ format: 'uuid', description: 'Billing account for this payment order' })
    @IsUUID()
    accountId: string;

    @ApiProperty({ format: 'uuid', description: 'Plan to purchase' })
    @IsUUID()
    planId: string;
}

