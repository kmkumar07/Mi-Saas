import { Body, Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { ProcessWebhookUseCase } from '@application/use-cases/payments/process-webhook.use-case';
import { WebhookEventDto } from '@application/dtos/webhook-event.dto';

@ApiTags('webhooks')
@Controller('api/webhooks')
export class WebhooksController {
    constructor(
        private readonly processWebhookUseCase: ProcessWebhookUseCase,
    ) { }

    @Post('razorpay')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Razorpay webhook events' })
    @ApiHeader({
        name: 'x-razorpay-signature',
        description: 'Razorpay webhook signature for verification',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook processed successfully',
    })
    async handleRazorpayWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Body() payload: WebhookEventDto,
        @Headers('x-razorpay-signature') signature: string,
    ): Promise<{ received: boolean }> {
        if (!signature) {
            throw new Error('Missing Razorpay signature header');
        }

        // Get raw body for signature verification
        // rawBody is available when NestFactory is created with rawBody: true
        const rawBody = req.rawBody?.toString('utf8');

        // Pass raw body for proper signature verification
        await this.processWebhookUseCase.execute(payload, signature, rawBody);

        return { received: true };
    }
}

