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

const selectedRegion = ref('IN');
const planFamilies = ref([]);
const plans = ref([]);
const loading = ref(true);
const error = ref(null);

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

const loadPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Fetch plan families
    const families = await apiService.getPlanFamilies();
    planFamilies.value = families;
    
    // Fetch actual plans for each family
    const planPromises = families.map(async (family) => {
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

onMounted(() => {
  loadPlans();
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

