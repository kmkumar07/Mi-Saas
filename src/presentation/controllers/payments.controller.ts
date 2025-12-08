import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreatePaymentOrderUseCase } from '@application/use-cases/payments/create-payment-order.use-case';
import { VerifyPaymentUseCase } from '@application/use-cases/payments/verify-payment.use-case';
import { CreatePaymentOrderDto } from '@application/dtos/create-payment-order.dto';
import { PaymentOrderResponseDto } from '@application/dtos/payment-order-response.dto';
import { VerifyPaymentDto } from '@application/dtos/verify-payment.dto';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentsController {
    constructor(
        private readonly createPaymentOrderUseCase: CreatePaymentOrderUseCase,
        private readonly verifyPaymentUseCase: VerifyPaymentUseCase,
    ) { }

    @Post('create-order')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a payment order for Razorpay checkout' })
    @ApiResponse({
        status: 201,
        description: 'Payment order created successfully',
        type: PaymentOrderResponseDto,
    })
    async createOrder(
        @Body() dto: CreatePaymentOrderDto,
    ): Promise<PaymentOrderResponseDto> {
        return this.createPaymentOrderUseCase.execute(dto);
    }

    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify payment status after Razorpay checkout' })
    @ApiResponse({
        status: 200,
        description: 'Payment verification result',
    })
    async verify(
        @Body() dto: VerifyPaymentDto,
    ) {
        return this.verifyPaymentUseCase.execute(dto);
    }

    @Get(':paymentId/status')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get payment status by payment ID' })
    @ApiParam({ name: 'paymentId', description: 'Payment ID' })
    @ApiResponse({
        status: 200,
        description: 'Payment status',
    })
    async getStatus(
        @Param('paymentId') paymentId: string,
    ) {
        // This can be implemented if needed
        // For now, return a placeholder
        return { paymentId, status: 'pending' };
    }
}

