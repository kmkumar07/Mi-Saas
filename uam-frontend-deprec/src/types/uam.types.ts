// TypeScript types for UAM Frontend

export interface Role {
    id: string;
    tenantId?: string | null;
    roleCode: string;
    roleName: string;
    description?: string | null;
    isSystemRole: boolean;
    hierarchyLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRoleDto {
    roleCode: string;
    roleName: string;
    description?: string;
    hierarchyLevel: number;
}

export interface Permission {
    id: string;
    roleId: string;
    featureId: string;
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AssignPermissionDto {
    featureId: string;
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
}

export interface User {
    id: string;
    tenantId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName: string;
    isActive: boolean;
    isEmailVerified: boolean;
    authProvider: string;
    accountType: string;
    isCompanyOwner: boolean;
    emailDomain?: string | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Feature {
    featureId: string;
    featureName: string;
    featureCode: string;
    featureDescription?: string;
    featureType: string;
}

export interface Product {
    productId: string;
    productName: string;
    features: Feature[];
}

export interface TenantDashboard {
    tenantId: string;
    tenantName: string;
    subscriptions: any[];
    plans: any[];
    featureUsage: Feature[];
    totalFeatures: number;
    activeSubscriptions: number;
}

export interface TenantFeaturesResponse {
    tenantId: string;
    products: Product[];
    totalFeatures: number;
    activeSubscriptions: number;
}

export interface UserRole {
    id: string;
    userId: string;
    roleId: string;
    assignedBy?: string;
    assignedAt: Date;
}

export interface RoleWithPermissions extends Role {
    permissions: Permission[];
    permissionCount: number;
}

export interface UserWithRoles extends User {
    roles: Role[];
}
