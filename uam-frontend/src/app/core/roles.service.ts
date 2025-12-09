import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL, DEFAULT_TENANT_ID } from './api.config';

export interface Role {
  id: string;
  roleCode: string;
  roleName: string;
  description?: string;
  hierarchyLevel: number;
  isSystemRole: boolean;
}

export interface PermissionMatrixRow {
  featureId: string;
  featureName: string;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);

  listRoles() {
    return this.http.get<Role[]>(`${API_BASE_URL}/api/roles`);
  }

  createRole(input: {
    roleCode: string;
    roleName: string;
    description?: string;
    hierarchyLevel: number;
  }) {
    return this.http.post<Role>(`${API_BASE_URL}/api/roles`, {
      tenantId: DEFAULT_TENANT_ID,
      ...input,
    });
  }

  bulkAssignPermissions(roleId: string, rows: PermissionMatrixRow[]) {
    const permissions = rows.map((row) => ({
      featureId: row.featureId,
      canRead: row.canRead,
      canWrite: row.canWrite,
      // Map delete column to canExecute on backend
      canExecute: row.canExecute,
    }));

    return this.http.post(`${API_BASE_URL}/api/roles/${roleId}/permissions/bulk`, {
      permissions,
    });
  }
}


