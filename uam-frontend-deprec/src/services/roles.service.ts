import api from './api';
import type { Role, CreateRoleDto } from '@/types/uam.types';

const ROLES_BASE_URL = '/roles';

export const rolesService = {
    /**
     * Get all roles
     */
    async getRoles(): Promise<Role[]> {
        const response = await api.get<Role[]>(ROLES_BASE_URL);
        return response.data;
    },

    /**
     * Get role by ID
     */
    async getRole(id: string): Promise<Role> {
        const response = await api.get<Role>(`${ROLES_BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Create a new role
     */
    async createRole(data: CreateRoleDto): Promise<Role> {
        const response = await api.post<Role>(ROLES_BASE_URL, data);
        return response.data;
    },

    /**
     * Update a role
     */
    async updateRole(id: string, data: Partial<CreateRoleDto>): Promise<Role> {
        const response = await api.put<Role>(`${ROLES_BASE_URL}/${id}`, data);
        return response.data;
    },

    /**
     * Delete a role
     */
    async deleteRole(id: string): Promise<void> {
        await api.delete(`${ROLES_BASE_URL}/${id}`);
    },
};
