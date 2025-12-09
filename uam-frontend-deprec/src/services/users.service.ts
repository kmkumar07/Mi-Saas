import api from './api';
import type { User, UserRole } from '@/types/uam.types';

const USERS_BASE_URL = '/users';

export const usersService = {
    /**
     * Get all users for the tenant
     */
    async getUsers(): Promise<User[]> {
        const response = await api.get<User[]>(USERS_BASE_URL);
        return response.data;
    },

    /**
     * Get user by ID
     */
    async getUser(id: string): Promise<User> {
        const response = await api.get<User>(`${USERS_BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Get user's assigned roles
     */
    async getUserRoles(userId: string): Promise<UserRole[]> {
        const response = await api.get<UserRole[]>(`${USERS_BASE_URL}/${userId}/roles`);
        return response.data;
    },

    /**
     * Assign a role to a user
     */
    async assignRoleToUser(userId: string, roleId: string): Promise<UserRole> {
        const response = await api.post<UserRole>(`${USERS_BASE_URL}/${userId}/roles`, { roleId });
        return response.data;
    },

    /**
     * Remove a role from a user
     */
    async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
        await api.delete(`${USERS_BASE_URL}/${userId}/roles/${roleId}`);
    },

    /**
     * Bulk assign roles to a user
     */
    async bulkAssignRoles(userId: string, roleIds: string[]): Promise<UserRole[]> {
        const response = await api.post<UserRole[]>(`${USERS_BASE_URL}/${userId}/roles/bulk`, { roleIds });
        return response.data;
    },
};
