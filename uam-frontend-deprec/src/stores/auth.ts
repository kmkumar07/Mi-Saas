import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types/user.types';
import { authService } from '@/services/auth.service';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
    const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));

    const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

    async function login(email: string, password: string) {
        const response = await authService.login(email, password);
        accessToken.value = response.accessToken;
        refreshToken.value = response.refreshToken;
        user.value = response.user;

        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
    }

    function logout() {
        user.value = null;
        accessToken.value = null;
        refreshToken.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    async function refreshAccessToken() {
        if (!refreshToken.value) throw new Error('No refresh token');

        const response = await authService.refresh(refreshToken.value);
        accessToken.value = response.accessToken;
        localStorage.setItem('accessToken', response.accessToken);
    }

    return {
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
    };
});
