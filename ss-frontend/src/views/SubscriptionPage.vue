<template>
  <div class="subscription-page">
    <header class="page-header">
      <div class="container">
        <div class="region-selector">
          <select v-model="selectedRegion" class="region-dropdown">
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 United States</option>
            <option value="GB">🇬🇧 United Kingdom</option>
          </select>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <div
          v-if="isUamAuthenticated && hasActiveSubscription"
          class="dashboard-cta"
        >
          <p class="dashboard-cta__text">
            You already have an active subscription.
          </p>
          <button class="btn btn-primary" @click="$router.push({ name: 'TenantDashboard' })">
            Go to dashboard
          </button>
        </div>

        <div v-if="loading" class="loading">
          <p>Loading plans...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="loadPlans" class="btn btn-primary">Retry</button>
        </div>

        <div v-else class="plans-container">
          <div class="plans-grid">
            <PlanCard
              v-for="plan in displayedPlans"
              :key="plan.id"
              :plan="plan"
              :subscription-status="getPlanStatus(plan)"
              :is-uam-authenticated="isUamAuthenticated"
              :has-active-subscription="hasActiveSubscription"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import PlanCard from '../components/PlanCard.vue';
import { apiService } from '../services/api';
import { getCurrentUser } from '../services/uamAuth';

const selectedRegion = ref('IN');
const planFamilies = ref([]);
const plans = ref([]);
const loading = ref(true);
const error = ref(null);

// Current subscription context from UAM (if logged in)
const currentPlanId = ref(null);
const currentPlanPrice = ref(null);
const hasActiveSubscription = ref(false);
// null = not determined yet; true/false after SSO check
const isUamAuthenticated = ref(null);

const displayedPlans = computed(() => {
  // If we have plans, use them; otherwise use plan families as fallback
  if (plans.value.length > 0) {
    return plans.value.filter(plan => 
      !plan.status || plan.status === 'published' || plan.status === 'active'
    );
  }
  
  // Fallback: create plan-like objects from plan families
  // Note: Plan families don't have actual plan data, so we show them with default values
  // In production, you should add an endpoint to get actual plans by family ID
  return planFamilies.value.map(family => ({
    id: family.id,
    name: family.name,
    planCode: family.planCode,
    metadata: {
      ...family.metadata,
      isPlanFamily: true, // Flag to indicate this is a plan family, not an actual plan
      description: family.metadata?.description || `${family.planCode} tier plans`,
    },
    price: {
      value: family.metadata?.price ? (family.metadata.price * 100) : 0, // Convert to paise/cents if price exists
      currency: family.metadata?.currency || 'INR',
      recurringChargePeriod: {
        chargeFrequency: family.metadata?.chargeFrequency || 'MONTHLY',
      },
    },
    status: 'active',
    products: [],
  }));
});

function getPlanStatus(plan) {
  if (!currentPlanId.value) return null;

  if (plan.id === currentPlanId.value) {
    return 'current';
  }

  if (currentPlanPrice.value != null && plan.price?.value != null) {
    if (plan.price.value > currentPlanPrice.value) {
      return 'upgrade';
    }
  }

  return null;
}

const loadPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Fetch plan families and sort by rank (ascending)
    const families = await apiService.getPlanFamilies();
    planFamilies.value = [...families].sort((a, b) => (a.rank || 0) - (b.rank || 0));
    
    // Fetch actual plans for each family (in sorted order)
    const planPromises = planFamilies.value.map(async (family) => {
      try {
        const familyPlans = await apiService.getPlansByFamily(family.id);
        return familyPlans;
      } catch (err) {
        console.warn(`Could not fetch plans for plan family ${family.id}:`, err);
        return [];
      }
    });
    
    const plansArrays = await Promise.all(planPromises);
    // Flatten the array of arrays into a single array
    plans.value = plansArrays.flat();
    
  } catch (err) {
    error.value = err.message || 'Failed to load plans';
    console.error('Error loading plans:', err);
  } finally {
    loading.value = false;
  }
};

const loadCurrentSubscription = async () => {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      isUamAuthenticated.value = false;
      return;
    }

    isUamAuthenticated.value = true;

    const dashboard = await apiService.getTenantDashboard(user.tenantId);
    const activeSubs = dashboard.subscriptions.filter(
      (s) => s.status === 'active' || s.status === 'trial',
    );

    hasActiveSubscription.value = activeSubs.length > 0;
    if (!activeSubs.length) return;

    const primarySub = activeSubs[0];
    currentPlanId.value = primarySub.planId;

    const currentPlan = dashboard.plans.find((p) => p.id === primarySub.planId);
    currentPlanPrice.value = currentPlan?.price?.value ?? null;
  } catch (e) {
    // Not logged in via UAM or dashboard not available; ignore for public landing page.
    isUamAuthenticated.value = false;
  }
};

onMounted(() => {
  loadPlans();
  loadCurrentSubscription();
});
</script>

<style scoped>
.subscription-page {
  min-height: 100vh;
  background: #f9fafb;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 0;
}

.region-selector {
  display: flex;
  justify-content: flex-start;
}

.region-dropdown {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.main-content {
  padding: 60px 0;
}

.dashboard-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  color: #166534;
  margin-bottom: 24px;
}

.dashboard-cta__text {
  margin: 0;
  font-size: 14px;
}

.plans-container {
  margin-top: 40px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .plans-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.error {
  text-align: center;
  padding: 40px;
  color: #ef4444;
}

.error p {
  margin-bottom: 16px;
  font-size: 16px;
}
</style>

