import api from './api';
import type { Permission, AssignPermissionDto } from '@/types/uam.types';

const PERMISSIONS_BASE_URL = '/permissions';

export const permissionsService = {
    /**
     * Get all permissions for a role
     */
    async getRolePermissions(roleId: string): Promise<Permission[]> {
        const response = await api.get<Permission[]>(`/roles/${roleId}/permissions`);
        return response.data;
    },

    /**
     * Assign permission to a role
     */
    async assignPermission(roleId: string, data: AssignPermissionDto): Promise<Permission> {
        const response = await api.post<Permission>(`/roles/${roleId}/permissions`, data);
        return response.data;
    },

    /**
     * Update a permission
     */
    async updatePermission(permissionId: string, data: Partial<AssignPermissionDto>): Promise<Permission> {
        const response = await api.put<Permission>(`${PERMISSIONS_BASE_URL}/${permissionId}`, data);
        return response.data;
    },

    /**
     * Revoke/delete a permission
     */
    async revokePermission(permissionId: string): Promise<void> {
        await api.delete(`${PERMISSIONS_BASE_URL}/${permissionId}`);
    },

    /**
     * Bulk assign permissions to a role
     */
    async bulkAssignPermissions(roleId: string, permissions: AssignPermissionDto[]): Promise<Permission[]> {
        const response = await api.post<Permission[]>(`/roles/${roleId}/permissions/bulk`, { permissions });
        return response.data;
    },
};
