import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPaymentOrderRepository, PAYMENT_ORDER_REPOSITORY } from '@domain/repositories/payment-order.repository.interface';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/repositories/payment.repository';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '@domain/repositories/subscription.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/services/payment-gateway.interface';
import { Payment } from '@domain/entities/payment.entity';
import { VerifyPaymentDto } from '@application/dtos/verify-payment.dto';
import { SubscriptionResponseDto } from '@application/dtos/subscription-response.dto';
import { ActivateTenantPlanUseCase } from '@application/use-cases/tenant-activation/activate-tenant-plan.use-case';

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
        private readonly activateTenantPlanUseCase: ActivateTenantPlanUseCase,
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

            // If payment doesn't exist but payment status is completed, create it
            // This handles cases where webhook hasn't fired yet or failed
            if (!payment && paymentStatus === 'completed') {
                // Get payment details from Razorpay SDK
                // Access the Razorpay instance from the gateway service
                const razorpayGateway = this.paymentGateway as any;
                let paymentEntity: any = null;
                
                // Fetch payment details from Razorpay
                if (razorpayGateway.razorpay) {
                    try {
                        paymentEntity = await razorpayGateway.razorpay.payments.fetch(dto.paymentId);
                    } catch (err) {
                        console.error('[VERIFY PAYMENT] Error fetching payment details from Razorpay:', err);
                        // Continue with minimal info if fetch fails
                    }
                }
                
                payment = new Payment({
                    accountId: paymentOrder.accountId,
                    subscriptionId: paymentOrder.subscriptionId,
                    amount: paymentOrder.amount,
                    currency: paymentOrder.currency,
                    status: 'completed',
                    gatewayPaymentId: dto.paymentId,
                    gatewayCustomerId: paymentEntity?.customer_id || null,
                    paymentMethod: paymentEntity?.method || 'card',
                    paymentType: 'subscription',
                    description: `Payment for order ${dto.orderId}`,
                    metadata: {
                        razorpayOrderId: dto.orderId,
                        razorpayPaymentId: dto.paymentId,
                        paymentEntity: paymentEntity || {},
                        verifiedManually: true, // Mark that this was verified manually, not via webhook
                    },
                });

                payment = await this.paymentRepository.create(payment);
            }

            if (payment && paymentStatus === 'completed') {
                // Update payment status if needed
                if (payment.status !== 'completed') {
                    await this.paymentRepository.updateStatus(payment.id, 'completed');
                }

                // Activate subscription if payment is completed
                let subscription = null;
                if (paymentOrder.subscriptionId) {
                    subscription = await this.subscriptionRepository.findById(paymentOrder.subscriptionId);
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

                // Automatically trigger tenant activation after successful payment
                if (subscription && subscription.status === 'active' && subscription.tenantId) {
                    try {
                        await this.activateTenantPlanUseCase.execute({
                            tenantId: subscription.tenantId,
                            subscriptionId: subscription.id,
                        });
                    } catch (error: any) {
                        // Log error but don't fail the payment verification
                        // Activation can be retried later if needed
                        console.error('[VERIFY PAYMENT] Failed to activate tenant plan:', error.message);
                    }
                }

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

