<template>
  <div class="success-page">
    <div class="container">
      <div class="success-content">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h1>Payment Successful!</h1>
        <p class="success-message">
          Your subscription has been activated successfully.
        </p>

        <div v-if="subscriptionDetails" class="subscription-details">
          <h2>Subscription Details</h2>
          <div class="detail-item">
            <span class="detail-label">Plan:</span>
            <span class="detail-value">{{ subscriptionDetails.planName }}</span>
          </div>
          <div v-if="subscriptionDetails.subscriptionId" class="detail-item">
            <span class="detail-label">Subscription ID:</span>
            <span class="detail-value">{{ subscriptionDetails.subscriptionId }}</span>
          </div>
          <div v-if="subscriptionDetails.orderId" class="detail-item">
            <span class="detail-label">Order ID:</span>
            <span class="detail-value">{{ subscriptionDetails.orderId }}</span>
          </div>
          <div v-if="subscriptionDetails.amount" class="detail-item">
            <span class="detail-label">Amount Paid:</span>
            <span class="detail-value">
              {{ currencySymbol }}{{ formatPrice(subscriptionDetails.amount) }}
            </span>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="goToHome" class="btn btn-primary">
            Return to Plans
          </button>
          <button 
            v-if="subscriptionStore.tenantId" 
            @click="viewDashboard" 
            class="btn btn-secondary"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSubscriptionStore } from '../stores/subscription';

const route = useRoute();
const router = useRouter();
const subscriptionStore = useSubscriptionStore();

const subscriptionDetails = ref(null);

const currencySymbol = computed(() => {
  const plan = subscriptionStore.selectedPlan;
  if (!plan?.price) return '₹';
  const currency = plan.price.currency || 'INR';
  if (currency === 'INR') return '₹';
  if (currency === 'USD') return '$';
  return currency;
});

onMounted(() => {
  // Build subscription details from store
  const plan = subscriptionStore.selectedPlan;
  const paymentOrder = subscriptionStore.paymentOrder;

  subscriptionDetails.value = {
    planName: plan?.name || 'Unknown Plan',
    subscriptionId: subscriptionStore.subscriptionId || route.query.subscriptionId,
    orderId: paymentOrder?.orderId || route.query.orderId,
    paymentId: route.query.paymentId,
    amount: paymentOrder?.amount || plan?.price?.value,
  };
});

const formatPrice = (price) => {
  if (!price) return '0';
  const mainUnit = price / 100;
  return mainUnit.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const goToHome = () => {
  subscriptionStore.reset();
  router.push('/');
};

const viewDashboard = () => {
  if (subscriptionStore.tenantId) {
    router.push(`/dashboard/${subscriptionStore.tenantId}`);
  } else {
    router.push('/dashboard');
  }
};
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.success-content {
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  color: #22c55e;
}

.success-icon svg {
  width: 100%;
  height: 100%;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
}

.success-message {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 40px;
}

.subscription-details {
  background: #f9fafb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  text-align: left;
}

.subscription-details h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
  text-align: center;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  font-weight: 600;
  color: #111827;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-buttons .btn {
  min-width: 160px;
}
</style>

