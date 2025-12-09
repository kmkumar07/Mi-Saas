import api from './api';
import type { LoginResponse, RefreshResponse } from '@/types/user.types';

export const authService = {
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', { email, password });
        return response.data;
    },

    async refresh(refreshToken: string): Promise<RefreshResponse> {
        const response = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });
        return response.data;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },
};
