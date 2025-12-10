import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

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

// Shape of the SaaS features endpoint response
export interface TenantFeaturesResponse {
  tenantId: string;
  products: {
    productId: string;
    productName: string;
    features: {
      featureId: string;
      featureName: string;
      featureCode: string;
      featureDescription: string;
      featureType: string;
    }[];
  }[];
  totalFeatures: number;
  activeSubscriptions: number;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);

  listRoles() {
    return this.http.get<Role[]>(`${API_BASE_URL}/api/roles`);
  }

  getRole(id: string) {
    return this.http.get<Role>(`${API_BASE_URL}/api/roles/${id}`);
  }

  createRole(input: {
    roleCode: string;
    roleName: string;
    description?: string;
    hierarchyLevel: number;
  }) {
    return this.http.post<Role>(`${API_BASE_URL}/api/roles`, input);
  }

  updateRole(id: string, input: Partial<Omit<Role, 'id' | 'isSystemRole'>>) {
    return this.http.put<Role>(`${API_BASE_URL}/api/roles/${id}`, input);
  }

  bulkAssignPermissions(roleId: string, rows: PermissionMatrixRow[]) {
    const permissions = rows.map((row) => ({
      featureId: row.featureId,
      canRead: row.canRead,
      canWrite: row.canWrite,
      // Map delete column to canExecute on backend
      canExecute: row.canExecute,
    }));

    return this.http.put(`${API_BASE_URL}/api/roles/${roleId}/permissions/bulk`, {
      permissions,
    });
  }

  /**
   * Load the permission matrix rows for the current tenant.
   * The backend derives tenantId from the JWT token.
   */
  loadPermissionMatrix() {
    return this.http
      .get<TenantFeaturesResponse>(`${API_BASE_URL}/api/roles/tenant-features`)
      .pipe(
        map((response) => {
          const rows: PermissionMatrixRow[] = [];

          for (const product of response.products ?? []) {
            for (const feature of product.features ?? []) {
              rows.push({
                featureId: feature.featureId,
                featureName: `${product.productName} – ${feature.featureName}`,
                canRead: false,
                canWrite: false,
                canExecute: false,
              });
            }
          }

          return rows;
        }),
      );
  }

  /**
   * Load existing permissions for a specific role.
   */
  getRolePermissions(roleId: string) {
    return this.http.get<
      {
        id: string;
        roleId: string;
        featureId: string;
        canRead: boolean;
        canWrite: boolean;
        canExecute: boolean;
      }[]
    >(`${API_BASE_URL}/api/roles/${roleId}/permissions`);
  }

  /**
   * Load the list of products for the current tenant.
   * This reuses the tenant-features endpoint and extracts just the products.
   */
  loadTenantProducts() {
    return this.http
      .get<TenantFeaturesResponse>(`${API_BASE_URL}/api/roles/tenant-features`)
      .pipe(map((response) => response.products ?? []));
  }
}


