import axios from 'axios';
import type { Feature, TenantDashboard, Product } from '@/types/uam.types';

// Subscription backend URL
const SUBSCRIPTION_API_URL = import.meta.env.VITE_SUBSCRIPTION_API_URL || 'http://localhost:3000';

const subscriptionApi = axios.create({
    baseURL: SUBSCRIPTION_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const featuresService = {
    /**
     * Get tenant's features from subscription backend internal API
     * Returns features grouped by product
     */
    async getTenantFeatures(tenantId: string): Promise<Feature[]> {
        const response = await subscriptionApi.get<{ products: Product[] }>(`/api/internal/features/tenant/${tenantId}`);
        // Flatten products into features array for backward compatibility
        const features: Feature[] = [];
        response.data.products.forEach(product => {
            features.push(...product.features);
        });
        return features;
    },

    /**
     * Get tenant's products with features grouped
     */
    async getTenantProducts(tenantId: string): Promise<Product[]> {
        const response = await subscriptionApi.get<{ products: Product[] }>(`/api/internal/features/tenant/${tenantId}`);
        return response.data.products;
    },

    /**
     * Get tenant dashboard with subscriptions, plans, and features
     * Note: This is the full dashboard API, use getTenantFeatures for just features
     */
    async getTenantDashboard(tenantId: string): Promise<TenantDashboard> {
        const response = await subscriptionApi.get<TenantDashboard>(`/tenants/${tenantId}/dashboard`);
        return response.data;
    },
};
