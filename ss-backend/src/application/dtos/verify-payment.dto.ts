import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class VerifyPaymentDto {
    @ApiProperty({ description: 'Razorpay order ID' })
    @IsString()
    orderId: string;

    @ApiPropertyOptional({ description: 'Razorpay payment ID (optional)' })
    @IsOptional()
    @IsString()
    paymentId?: string;
}

