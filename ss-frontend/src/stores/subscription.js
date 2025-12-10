import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    selectedPlan: null,
    tenantId: null,
    accountId: null,
    paymentOrder: null,
    subscriptionId: null,
  }),

  actions: {
    setSelectedPlan(plan) {
      this.selectedPlan = plan;
    },

    setTenantId(tenantId) {
      this.tenantId = tenantId;
    },

    setAccountId(accountId) {
      this.accountId = accountId;
    },

    setPaymentOrder(paymentOrder) {
      this.paymentOrder = paymentOrder;
    },

    setSubscriptionId(subscriptionId) {
      this.subscriptionId = subscriptionId;
    },

    reset() {
      this.selectedPlan = null;
      this.tenantId = null;
      this.accountId = null;
      this.paymentOrder = null;
      this.subscriptionId = null;
    },
  },
});

