import { createRouter, createWebHistory } from 'vue-router';
import SubscriptionPage from '../views/SubscriptionPage.vue';
import PaymentSuccessPage from '../views/PaymentSuccessPage.vue';
import TenantDashboard from '../views/TenantDashboard.vue';
import { getCurrentUser } from '../services/uamAuth';

const routes = [
  {
    path: '/',
    name: 'Subscription',
    component: SubscriptionPage,
  },
  {
    path: '/payment-success',
    name: 'PaymentSuccess',
    component: PaymentSuccessPage,
  },
  {
    path: '/dashboard/:tenantId?',
    name: 'TenantDashboard',
    component: TenantDashboard,
    props: true,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let cachedUser = null;

router.beforeEach(async (to, from, next) => {
  if (!to.meta.requiresAuth) {
    return next();
  }

  try {
    if (!cachedUser) {
      cachedUser = await getCurrentUser();
    }

    // If route doesn't already have tenantId param, inject from current user
    if (!to.params.tenantId && cachedUser?.tenantId) {
      to.params.tenantId = cachedUser.tenantId;
    }

    next();
  } catch (err) {
    const uamAppUrl = import.meta.env.VITE_UAM_APP_URL || 'http://localhost:4200';
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.href = `${uamAppUrl}/auth/login?redirect=${redirectUrl}`;
  }
});

export default router;

