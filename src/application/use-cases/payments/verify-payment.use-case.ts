import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPaymentOrderRepository, PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { Payment } from '@domain/entities/payment.entity';
import { VerifyPaymentDto } from '@application/dtos/verify-payment.dto';
import { SubscriptionResponseDto } from '@application/dtos/subscription-response.dto';

@Injectable()
export class VerifyPaymentUseCase {
    constructor(
        @Inject(PAYMENT_ORDER_REPOSITORY)
        private readonly paymentOrderRepository: IPaymentOrderRepository,
        @Inject(PAYMENT_REPOSITORY)
        private readonly paymentRepository: IPaymentRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
        @Inject(PAYMENT_GATEWAY)
        private readonly paymentGateway: IPaymentGateway,
    ) { }

    async execute(dto: VerifyPaymentDto): Promise<{ status: string; subscription?: SubscriptionResponseDto }> {
        // Find payment order by Razorpay order ID
        const paymentOrder = await this.paymentOrderRepository.findByRazorpayOrderId(dto.orderId);
        if (!paymentOrder) {
            throw new NotFoundException(`Payment order with Razorpay order ID ${dto.orderId} not found`);
        }

        // If payment ID is provided, verify payment status
        if (dto.paymentId) {
            const paymentStatus = await this.paymentGateway.getPaymentStatus(dto.paymentId);
            
            // Find or create payment record
            let payment: Payment | null = null;
            if (paymentOrder.paymentId) {
                payment = await this.paymentRepository.findById(paymentOrder.paymentId);
            }

            if (payment && paymentStatus === 'completed') {
                // Update payment status if needed
                if (payment.status !== 'completed') {
                    await this.paymentRepository.updateStatus(payment.id, 'completed');
                }

                // Activate subscription if payment is completed
                if (paymentOrder.subscriptionId) {
                    const subscription = await this.subscriptionRepository.findById(paymentOrder.subscriptionId);
                    if (subscription && subscription.status === 'incomplete') {
                        subscription.activate();
                        await this.subscriptionRepository.update(subscription);
                    }
                }

                // Mark payment order as paid
                if (!paymentOrder.isPaid()) {
                    paymentOrder.markAsPaid(payment.id);
                    await this.paymentOrderRepository.update(paymentOrder);
                }

                const subscription = paymentOrder.subscriptionId
                    ? await this.subscriptionRepository.findById(paymentOrder.subscriptionId)
                    : null;

                return {
                    status: 'completed',
                    subscription: subscription ? this.toDto(subscription) : undefined,
                };
            }
        }

        // Return current status
        return {
            status: paymentOrder.status,
        };
    }

    private toDto(subscription: any): SubscriptionResponseDto {
        return {
            id: subscription.id,
            accountId: subscription.accountId,
            tenantId: subscription.tenantId,
            customerId: subscription.customerId,
            planId: subscription.planId,
            status: subscription.status,
            seats: subscription.seats,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelledAt: subscription.cancelledAt,
            cancellationReason: subscription.cancellationReason,
            metadata: subscription.metadata,
            createdAt: subscription.createdAt,
        };
    }
}

