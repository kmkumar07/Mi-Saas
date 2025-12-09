import axios from 'axios';

/**
 * Shared Axios instance for calling external services from the UAM backend.
 * By default, this points to the main SaaS backend that owns public.tenants.
 */
export const externalHttpClient = axios.create({
    baseURL: process.env.SAAS_BACKEND_URL || 'http://localhost:3000',
    timeout: 5000,
});


