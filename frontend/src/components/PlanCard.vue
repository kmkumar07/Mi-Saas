<template>
  <div class="plan-card" :class="{ 'enterprise': isEnterprise }">
    <div class="plan-header">
      <h2>{{ plan.name }}</h2>
      <p v-if="plan.metadata?.description" class="plan-description">
        {{ plan.metadata.description }}
      </p>
    </div>

    <div class="plan-pricing">
      <div v-if="originalPrice && currentPrice > 0" class="price-original">
        <span class="currency">{{ currencySymbol }}</span>{{ formatPrice(originalPrice) }}
      </div>
      <div class="price-current" :class="{ 'price-zero': currentPrice === 0 }">
        <span class="currency">{{ currencySymbol }}</span>{{ formatPrice(currentPrice) }}
      </div>
      <div class="billing-period" v-if="billingPeriod && currentPrice > 0">
        {{ billingPeriod }}
      </div>
      <div v-if="currentPrice === 0 && !plan.metadata?.isPlanFamily" class="billing-period">
        Free plan
      </div>
    </div>

    <div v-if="targetAudience" class="target-audience">
      {{ targetAudience }}
    </div>

    <div class="plan-features">
      <div v-for="(feature, index) in features" :key="index" class="feature-item">
        <svg class="checkmark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ feature }}</span>
      </div>
    </div>

    <div class="plan-action">
      <button 
        v-if="!isEnterprise"
        @click="handleSubscribe"
        class="btn btn-primary btn-subscribe"
      >
        Start your 14-day free trial
      </button>
      <button 
        v-else
        @click="handleLearnMore"
        class="btn btn-primary btn-subscribe"
      >
        Learn more
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSubscriptionStore } from '../stores/subscription';

const props = defineProps({
  plan: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const subscriptionStore = useSubscriptionStore();

const isEnterprise = computed(() => {
  return props.plan.name?.toLowerCase().includes('enterprise') || 
         props.plan.planCode?.toUpperCase().includes('ENTERPRISE');
});

const currencySymbol = computed(() => {
  const currency = props.plan.price?.currency || 'INR';
  if (currency === 'INR') return '₹';
  if (currency === 'USD') return '$';
  return currency;
});

const currentPrice = computed(() => {
  return props.plan.price?.value || 0;
});

const originalPrice = computed(() => {
  // Check metadata for original price or calculate discount
  if (props.plan.metadata?.originalPrice) {
    return props.plan.metadata.originalPrice;
  }
  // If current price suggests a discount, show a higher original price
  if (currentPrice.value > 0 && props.plan.metadata?.discount) {
    return Math.round(currentPrice.value / (1 - props.plan.metadata.discount / 100));
  }
  return null;
});

const billingPeriod = computed(() => {
  const frequency = props.plan.price?.recurringChargePeriod?.chargeFrequency;
  if (frequency === 'MONTHLY') {
    return 'per Organization per Month (Billed annually)';
  }
  if (frequency === 'YEARLY') {
    return 'per Organization per Year';
  }
  return 'per Organization per Month';
});

const targetAudience = computed(() => {
  if (props.plan.metadata?.targetAudience) {
    return props.plan.metadata.targetAudience;
  }
  
  // If this is a plan family, use the description from metadata
  if (props.plan.metadata?.isPlanFamily && props.plan.metadata?.description) {
    return props.plan.metadata.description;
  }
  
  // Default based on plan name
  if (isEnterprise.value) {
    return 'A platform engineered for operational scale and deep customization';
  }
  if (props.plan.name?.toUpperCase().includes('STANDARD')) {
    return 'Best suited for businesses with one time billing requirements';
  }
  if (props.plan.name?.toUpperCase().includes('PREMIUM')) {
    return 'Best suited for businesses with one time and subscription billing requirements';
  }
  return '';
});

const features = computed(() => {
  // If this is a plan family (not an actual plan), show contact message
  if (props.plan.metadata?.isPlanFamily) {
    return ['Contact us for details'];
  }

  if (props.plan.metadata?.features && Array.isArray(props.plan.metadata.features)) {
    return props.plan.metadata.features;
  }
  
  // Default features based on plan type
  if (isEnterprise.value) {
    return [
      'High volume customers and transactions',
      'Advanced usage-based billing controls',
      'Flexible revenue recognition configurations',
      'Analytics with forecasting and AI insights',
    ];
  }
  
  if (props.plan.name?.toUpperCase().includes('PREMIUM')) {
    return [
      'Includes everything in Standard +',
      'Manage subscription billing',
      'Multi-user access for up to 10 users',
      'Use hosted payment pages',
      'Automate billing for usage-based pricing',
    ];
  }
  
  if (props.plan.name?.toUpperCase().includes('STANDARD')) {
    return [
      'Create quotes and GST compliant invoices',
      'Customize for local languages and tax laws',
      'Multi-user access for up to 3 users',
      'Handle multi-currency transactions',
      'Set up automated payment reminders',
    ];
  }
  
  // Fallback: use products/features from API if available
  if (props.plan.products && props.plan.products.length > 0) {
    const featureList = [];
    props.plan.products.forEach(product => {
      if (product.features && product.features.length > 0) {
        product.features.forEach(feature => {
          featureList.push(feature.name || feature.description || feature.code);
        });
      }
    });
    return featureList.length > 0 ? featureList : ['Contact us for details'];
  }
  
  return ['Contact us for details'];
});

const formatPrice = (price) => {
  // Convert from smallest currency unit (paise/cents) to main unit
  const mainUnit = price / 100;
  return mainUnit.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const handleSubscribe = () => {
  // Check if this is a plan family (not an actual plan)
  if (props.plan.metadata?.isPlanFamily) {
    alert('This is a plan family. Please contact us to get details about available plans in this family.');
    return;
  }

  // Validate that we have a valid plan with an ID
  if (!props.plan.id) {
    alert('Invalid plan. Please contact us for more information.');
    return;
  }

  subscriptionStore.setSelectedPlan(props.plan);
  router.push(`/register/${props.plan.id}`);
};

const handleLearnMore = () => {
  // For enterprise or plan families, show contact message
  if (props.plan.metadata?.isPlanFamily) {
    alert('This is a plan family. Please contact us to get details about available plans in this family.');
  } else {
    alert('Please contact us for Enterprise pricing and features.');
  }
};
</script>

<style scoped>
.plan-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.plan-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.plan-card.enterprise {
  border: 2px solid #22c55e;
}

.plan-header {
  margin-bottom: 24px;
}

.plan-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.plan-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.plan-pricing {
  margin-bottom: 20px;
}

.price-original {
  font-size: 18px;
  color: #9ca3af;
  text-decoration: line-through;
  margin-bottom: 4px;
}

.price-current {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.price-current.price-zero {
  color: #6b7280;
}

.currency {
  font-size: 24px;
  margin-right: 4px;
}

.billing-period {
  font-size: 14px;
  color: #6b7280;
}

.target-audience {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 24px;
  line-height: 1.5;
  font-style: italic;
}

.plan-features {
  flex: 1;
  margin-bottom: 32px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 14px;
  color: #374151;
}

.checkmark {
  width: 20px;
  height: 20px;
  color: #22c55e;
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

.plan-action {
  margin-top: auto;
}

.btn-subscribe {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
}
</style>

