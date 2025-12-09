import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/TenantRegistrationView.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/',
            name: 'dashboard',
            component: () => import('@/views/DashboardView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/users',
            name: 'users',
            component: () => import('@/views/UsersView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/roles',
            name: 'roles',
            component: () => import('@/views/RolesView.vue'),
            meta: { requiresAuth: true },
        },
    ],
});

// Navigation guard
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' });
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router;
