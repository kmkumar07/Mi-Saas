import { ApiProperty } from '@nestjs/swagger';

export class PaymentOrderResponseDto {
    @ApiProperty({ description: 'Internal payment order ID' })
    orderId: string;

    @ApiProperty({ description: 'Razorpay order ID' })
    razorpayOrderId: string;

    @ApiProperty({ description: 'Amount in paise/cents' })
    amount: number;

    @ApiProperty({ description: 'Currency code (e.g., INR, USD)' })
    currency: string;

    @ApiProperty({ description: 'Razorpay key ID for frontend integration' })
    keyId: string;

    @ApiProperty({ description: 'Subscription ID (if subscription was created)', required: false })
    subscriptionId?: string;
}

