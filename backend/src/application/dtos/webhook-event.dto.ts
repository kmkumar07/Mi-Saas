import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventDto {
    @ApiProperty({ description: 'Razorpay event ID' })
    entity: string;

    @ApiProperty({ description: 'Event account ID' })
    account_id: string;

    @ApiProperty({ description: 'Event type (e.g., payment.captured, payment.failed)' })
    event: string;

    @ApiProperty({ description: 'Event contains array of entities' })
    contains: string[];

    @ApiProperty({ description: 'Event payload' })
    payload: {
        payment?: {
            entity: {
                id: string;
                entity: string;
                amount: number;
                currency: string;
                status: string;
                order_id: string;
                [key: string]: any;
            };
        };
        order?: {
            entity: {
                id: string;
                entity: string;
                amount: number;
                currency: string;
                status: string;
                [key: string]: any;
            };
        };
        [key: string]: any;
    };

    @ApiProperty({ description: 'Event created timestamp' })
    created_at: number;
}

