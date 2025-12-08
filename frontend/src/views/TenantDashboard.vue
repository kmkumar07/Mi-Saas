<template>
  <div class="dashboard-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <p>Loading dashboard...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadDashboard" class="btn btn-primary">Retry</button>
      </div>

      <div v-else-if="dashboardData" class="dashboard-content">
        <!-- Header -->
        <div class="dashboard-header">
          <div class="header-top">
            <button @click="goToAllTenants" class="btn-back">← Back to All Tenants</button>
          </div>
          <h1>{{ dashboardData.tenantName }} Dashboard</h1>
          <div class="tenant-id">
            <span class="label">Tenant ID:</span>
            <span class="value">{{ dashboardData.tenantId }}</span>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>{{ dashboardData.activeSubscriptions }}</h3>
              <p>Active Subscriptions</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">🎯</div>
            <div class="card-content">
              <h3>{{ dashboardData.totalFeatures }}</h3>
              <p>Total Features</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">📦</div>
            <div class="card-content">
              <h3>{{ dashboardData.plans.length }}</h3>
              <p>Plans</p>
            </div>
          </div>
        </div>

        <!-- Subscriptions Section -->
        <div class="dashboard-section">
          <h2>Subscriptions</h2>
          <div v-if="dashboardData.subscriptions.length === 0" class="empty-state">
            <p>No subscriptions found</p>
          </div>
          <div v-else class="subscriptions-list">
            <div
              v-for="subscription in dashboardData.subscriptions"
              :key="subscription.id"
              class="subscription-card"
            >
              <div class="subscription-header">
                <h3>{{ getPlanName(subscription.planId) }}</h3>
                <span :class="['status-badge', `status-${subscription.status}`]">
                  {{ subscription.status.toUpperCase() }}
                </span>
              </div>
              <div class="subscription-details">
                <div v-if="subscription.status === 'incomplete'" class="incomplete-notice">
                  <p>⚠️ Payment incomplete. Please complete the payment to activate this subscription.</p>
                </div>
                <div class="detail-item">
                  <span class="label">Subscription ID:</span>
                  <span class="value">{{ subscription.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Seats:</span>
                  <span class="value">{{ subscription.seats }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Current Period:</span>
                  <span class="value">
                    {{ formatDate(subscription.currentPeriodStart) }} - 
                    {{ formatDate(subscription.currentPeriodEnd) }}
                  </span>
                </div>
                <div v-if="subscription.cancelledAt" class="detail-item">
                  <span class="label">Cancelled:</span>
                  <span class="value">{{ formatDate(subscription.cancelledAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Plans Section -->
        <div class="dashboard-section">
          <h2>Purchased Plans</h2>
          <div v-if="dashboardData.plans.length === 0" class="empty-state">
            <p>No plans found</p>
          </div>
          <div v-else class="plans-list">
            <div
              v-for="plan in dashboardData.plans"
              :key="plan.id"
              class="plan-card"
            >
              <div class="plan-header">
                <h3>{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">{{ getCurrencySymbol(plan.price?.currency) }}</span>
                  <span class="amount">{{ formatPrice(plan.price?.value || 0) }}</span>
                  <span class="period">/ {{ getBillingPeriod(plan) }}</span>
                </div>
              </div>
              <div class="plan-details">
                <div class="detail-item">
                  <span class="label">Plan Code:</span>
                  <span class="value">{{ plan.planCode }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Status:</span>
                  <span class="value">{{ plan.status }}</span>
                </div>
                <div v-if="plan.products && plan.products.length > 0" class="products">
                  <span class="label">Products:</span>
                  <div class="products-list">
                    <span
                      v-for="product in plan.products"
                      :key="product.id"
                      class="product-tag"
                    >
                      {{ product.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature Usage Section -->
        <div class="dashboard-section">
          <h2>Feature Usage</h2>
          <div v-if="dashboardData.featureUsage.length === 0" class="empty-state">
            <p>No feature usage data available</p>
          </div>
          <div v-else class="features-list">
            <div
              v-for="feature in dashboardData.featureUsage"
              :key="feature.featureId"
              class="feature-card"
            >
              <div class="feature-header">
                <h4>{{ feature.featureName }}</h4>
                <span class="feature-type">{{ feature.featureType }}</span>
              </div>
              <div v-if="feature.featureDescription" class="feature-description">
                {{ feature.featureDescription }}
              </div>
              <div class="usage-stats">
                <div class="usage-item">
                  <span class="label">Used:</span>
                  <span class="value usage-value">{{ feature.used }}</span>
                </div>
                <div class="usage-item">
                  <span class="label">Limit:</span>
                  <span class="value">
                    {{ feature.isUnlimited ? 'Unlimited' : (feature.limit || 'N/A') }}
                  </span>
                </div>
                <div v-if="!feature.isUnlimited && feature.limit" class="usage-progress">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: `${Math.min((feature.used / feature.limit) * 100, 100)}%` }"
                    ></div>
                  </div>
                  <span class="progress-text">
                    {{ Math.round((feature.used / feature.limit) * 100) }}% used
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tenants List (if no tenantId in route and no data loaded) -->
      <div v-if="!tenantIdFromRoute && !dashboardData && !loading" class="tenants-list-section">
        <div class="tenants-container">
          <h2>All Tenants</h2>
          <div v-if="loadingTenants" class="loading">
            <p>Loading tenants...</p>
          </div>
          <div v-else-if="tenantsError" class="error">
            <p>{{ tenantsError }}</p>
            <button @click="loadTenants" class="btn btn-primary">Retry</button>
          </div>
          <div v-else-if="tenants.length === 0" class="empty-state">
            <p>No tenants found</p>
          </div>
          <div v-else class="tenants-grid">
            <div
              v-for="tenant in tenants"
              :key="tenant.id"
              class="tenant-card"
              @click="viewTenantDashboard(tenant.id)"
            >
              <div class="tenant-card-header">
                <h3>{{ tenant.name }}</h3>
              </div>
              <div class="tenant-card-body">
                <div class="tenant-detail">
                  <span class="label">ID:</span>
                  <span class="value">{{ tenant.id }}</span>
                </div>
                <div v-if="tenant.emailDomain" class="tenant-detail">
                  <span class="label">Email Domain:</span>
                  <span class="value">{{ tenant.emailDomain }}</span>
                </div>
                <div class="tenant-detail">
                  <span class="label">Created:</span>
                  <span class="value">{{ formatDate(tenant.createdAt) }}</span>
                </div>
              </div>
              <div class="tenant-card-footer">
                <button class="btn btn-primary">View Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiService } from '../services/api';

const route = useRoute();
const router = useRouter();

const dashboardData = ref(null);
const loading = ref(false);
const error = ref(null);
const tenants = ref([]);
const loadingTenants = ref(false);
const tenantsError = ref(null);

const tenantIdFromRoute = computed(() => route.params.tenantId);

const loadDashboard = async (tenantId) => {
  const id = tenantId || tenantIdFromRoute.value;
  if (!id) {
    error.value = 'Tenant ID is required';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const data = await apiService.getTenantDashboard(id);
    dashboardData.value = data;
  } catch (err) {
    error.value = err.message || 'Failed to load dashboard';
    console.error('Error loading dashboard:', err);
  } finally {
    loading.value = false;
  }
};

const loadTenants = async () => {
  loadingTenants.value = true;
  tenantsError.value = null;

  try {
    const data = await apiService.getAllTenants();
    tenants.value = data;
  } catch (err) {
    tenantsError.value = err.message || 'Failed to load tenants';
    console.error('Error loading tenants:', err);
  } finally {
    loadingTenants.value = false;
  }
};

const viewTenantDashboard = (tenantId) => {
  router.push(`/dashboard/${tenantId}`);
};

const goToAllTenants = () => {
  router.push('/dashboard');
};

onMounted(() => {
  if (tenantIdFromRoute.value) {
    loadDashboard();
  } else {
    loadTenants();
  }
});

const getPlanName = (planId) => {
  const plan = dashboardData.value?.plans.find(p => p.id === planId);
  return plan?.name || 'Unknown Plan';
};

const formatPrice = (price) => {
  const mainUnit = price / 100;
  return mainUnit.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const getCurrencySymbol = (currency) => {
  if (currency === 'INR') return '₹';
  if (currency === 'USD') return '$';
  return currency || '₹';
};

const getBillingPeriod = (plan) => {
  const frequency = plan?.price?.recurringChargePeriod?.chargeFrequency;
  if (frequency === 'MONTHLY') return 'month';
  if (frequency === 'YEARLY') return 'year';
  if (frequency === 'ONE_TIME') return 'one-time';
  return 'month';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 0;
}

.dashboard-header {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-top {
  margin-bottom: 16px;
}

.btn-back {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #111827;
}

.dashboard-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
}

.tenant-id {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.tenant-id .label {
  color: #6b7280;
  font-weight: 500;
}

.tenant-id .value {
  color: #111827;
  font-family: monospace;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 32px;
}

.card-content h3 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.card-content p {
  font-size: 14px;
  color: #6b7280;
}

.dashboard-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.subscriptions-list,
.plans-list,
.features-list {
  display: grid;
  gap: 16px;
}

.subscription-card,
.plan-card,
.feature-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.subscription-card:hover,
.plan-card:hover,
.feature-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.subscription-header,
.plan-header,
.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subscription-header h3,
.plan-header h3,
.feature-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-trial {
  background: #dbeafe;
  color: #1e40af;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-incomplete {
  background: #fef3c7;
  color: #92400e;
}

.status-past_due {
  background: #fef3c7;
  color: #92400e;
}

.status-expired {
  background: #e5e7eb;
  color: #374151;
}

.subscription-details,
.plan-details {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-item .label {
  color: #6b7280;
  font-weight: 500;
  min-width: 120px;
}

.detail-item .value {
  color: #111827;
}

.incomplete-notice {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.incomplete-notice p {
  margin: 0;
  color: #92400e;
  font-size: 14px;
  font-weight: 500;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.plan-price .currency {
  font-size: 18px;
  color: #22c55e;
}

.plan-price .amount {
  font-size: 24px;
  font-weight: 700;
  color: #22c55e;
}

.plan-price .period {
  font-size: 14px;
  color: #6b7280;
}

.products {
  margin-top: 12px;
}

.products-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.product-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.feature-type {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.feature-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.usage-stats {
  display: grid;
  gap: 12px;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-value {
  font-weight: 600;
  color: #111827;
}

.usage-progress {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: #22c55e;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
}

.tenants-list-section {
  min-height: 60vh;
}

.tenants-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tenants-container h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
}

.tenants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.tenant-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.tenant-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #22c55e;
  transform: translateY(-2px);
}

.tenant-card-header {
  margin-bottom: 16px;
}

.tenant-card-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.tenant-card-body {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.tenant-detail {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.tenant-detail .label {
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
}

.tenant-detail .value {
  color: #111827;
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
}

.tenant-card-footer {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #22c55e;
  color: white;
  width: 100%;
}

.btn-primary:hover {
  background: #16a34a;
}
</style>

