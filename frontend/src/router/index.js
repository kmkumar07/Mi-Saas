import { createRouter, createWebHistory } from 'vue-router';
import SubscriptionPage from '../views/SubscriptionPage.vue';
import RegistrationPage from '../views/RegistrationPage.vue';
import PaymentSuccessPage from '../views/PaymentSuccessPage.vue';

const routes = [
  {
    path: '/',
    name: 'Subscription',
    component: SubscriptionPage,
  },
  {
    path: '/register/:planId',
    name: 'Registration',
    component: RegistrationPage,
    props: true,
  },
  {
    path: '/payment-success',
    name: 'PaymentSuccess',
    component: PaymentSuccessPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

