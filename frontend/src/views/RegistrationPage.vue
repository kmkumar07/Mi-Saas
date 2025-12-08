<template>
  <div class="registration-page">
    <div class="container">
      <div class="page-header">
        <h1>Complete Your Registration</h1>
        <p>Set up your tenant and billing account to proceed with subscription</p>
      </div>

      <div v-if="loading" class="loading">
        <p>Loading plan details...</p>
      </div>

      <div v-else-if="selectedPlan" class="plan-summary">
        <h3>Selected Plan: {{ selectedPlan.name || 'Unknown Plan' }}</h3>
        <p class="plan-price">
          <span class="currency">{{ currencySymbol }}</span>{{ formatPrice(selectedPlan.price?.value || 0) }}
          <span class="billing-period">/ {{ getBillingPeriod(selectedPlan) }}</span>
        </p>
      </div>

      <div v-else class="error-message" style="margin-bottom: 20px; text-align: center;">
        <p>Unable to load plan details. Please go back and select a plan again.</p>
        <button @click="router.push('/')" class="btn btn-primary" style="margin-top: 16px;">
          Return to Plans
        </button>
      </div>

      <RegistrationForm v-if="selectedPlan" @registered="handleRegistered" />

      <div v-if="error" class="error-message" style="margin-top: 20px; text-align: center;">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RegistrationForm from '../components/RegistrationForm.vue';
import { apiService } from '../services/api';
import { useSubscriptionStore } from '../stores/subscription';
import { razorpayService } from '../services/razorpay';

const route = useRoute();
const router = useRouter();
const subscriptionStore = useSubscriptionStore();

const planId = route.params.planId;
const selectedPlan = ref(null);
const error = ref(null);
const loading = ref(true);

const currencySymbol = computed(() => {
  if (!selectedPlan.value?.price) return '₹';
  const currency = selectedPlan.value.price.currency || 'INR';
  if (currency === 'INR') return '₹';
  if (currency === 'USD') return '$';
  return currency;
});

onMounted(async () => {
  if (!planId) {
    error.value = 'No plan selected';
    // Try to get plan from store as fallback
    if (subscriptionStore.selectedPlan) {
      selectedPlan.value = subscriptionStore.selectedPlan;
      loading.value = false;
      return;
    }
    router.push('/');
    return;
  }

  try {
    const plan = await apiService.getPlan(planId);
    if (!plan || !plan.id) {
      throw new Error('Invalid plan data received');
    }
    selectedPlan.value = plan;
    subscriptionStore.setSelectedPlan(plan);
  } catch (err) {
    error.value = err.message || 'Failed to load plan details';
    console.error('Error loading plan:', err);
    // Try to get plan from store as fallback
    if (subscriptionStore.selectedPlan) {
      selectedPlan.value = subscriptionStore.selectedPlan;
    }
  } finally {
    loading.value = false;
  }
});

const formatPrice = (price) => {
  const mainUnit = price / 100;
  return mainUnit.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const getBillingPeriod = (plan) => {
  const frequency = plan?.price?.recurringChargePeriod?.chargeFrequency;
  if (frequency === 'MONTHLY') return 'month';
  if (frequency === 'YEARLY') return 'year';
  return 'month';
};

const handleRegistered = async ({ tenant, account }) => {
  // Validate that we have all required data
  if (!selectedPlan.value || !selectedPlan.value.id) {
    error.value = 'Plan information is missing. Please go back and select a plan.';
    return;
  }

  if (!tenant || !tenant.id) {
    error.value = 'Tenant information is missing. Please try again.';
    return;
  }

  if (!account || !account.id) {
    error.value = 'Account information is missing. Please try again.';
    return;
  }

  try {
    // Create payment order
    const paymentOrder = await apiService.createPaymentOrder({
      tenantId: tenant.id,
      accountId: account.id,
      planId: selectedPlan.value.id,
    });

    if (!paymentOrder || !paymentOrder.razorpayOrderId) {
      throw new Error('Invalid payment order response');
    }

    subscriptionStore.setPaymentOrder(paymentOrder);

    // Initialize Razorpay checkout
    try {
      const paymentResponse = await razorpayService.openCheckout({
        keyId: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        razorpayOrderId: paymentOrder.razorpayOrderId,
        name: 'AG SaaS',
        description: `Subscription for ${selectedPlan.value?.name || 'Selected Plan'}`,
        customerName: account.companyName || '',
        customerEmail: account.billingEmail || '',
      });

      // Verify payment
      const verificationResult = await apiService.verifyPayment({
        orderId: paymentOrder.razorpayOrderId,
        paymentId: paymentResponse.razorpay_payment_id,
      });

      if (verificationResult.subscriptionId) {
        subscriptionStore.setSubscriptionId(verificationResult.subscriptionId);
      }

      // Redirect to success page
      router.push({
        path: '/payment-success',
        query: {
          orderId: paymentOrder.orderId,
          paymentId: paymentResponse.razorpay_payment_id,
        },
      });
    } catch (paymentError) {
      if (paymentError.message === 'Payment cancelled by user') {
        error.value = 'Payment was cancelled. You can try again.';
      } else {
        error.value = paymentError.message || 'Payment failed. Please try again.';
        console.error('Payment error:', paymentError);
      }
    }
  } catch (err) {
    error.value = err.message || 'Failed to initiate payment. Please try again.';
    console.error('Error creating payment order:', err);
  }
};
</script>

<style scoped>
.registration-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 16px;
  color: #6b7280;
}

.plan-summary {
  background: white;
  border: 2px solid #22c55e;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  text-align: center;
}

.plan-summary h3 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.plan-price {
  font-size: 28px;
  font-weight: 700;
  color: #22c55e;
}

.currency {
  font-size: 20px;
  margin-right: 4px;
}

.billing-period {
  font-size: 16px;
  font-weight: 400;
  color: #6b7280;
}
</style>

