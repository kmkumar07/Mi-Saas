import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  // Plan Families
  async getPlanFamilies() {
    const response = await api.get('/api/plan-families');
    return response.data;
  },

  async getPlanFamily(id) {
    const response = await api.get(`/api/plan-families/${id}`);
    return response.data;
  },

  // Plans
  async getPlan(planId) {
    const response = await api.get(`/api/plans/${planId}`);
    return response.data;
  },

  async getPlansByFamily(familyId) {
    const response = await api.get(`/api/plans?familyId=${familyId}`);
    return response.data;
  },

  // Note: There's no endpoint to get all plans, so we'll need to fetch by family
  // For now, we'll fetch plan families and then get plans individually if needed

  // Tenants
  async createTenant(data) {
    const response = await api.post('/tenants', data);
    return response.data;
  },

  async getAllTenants() {
    const response = await api.get('/tenants');
    return response.data;
  },

  async getTenant(id) {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  // Accounts
  async createAccount(data) {
    const response = await api.post('/api/accounts', data);
    return response.data;
  },

  // Payments
  async createPaymentOrder(data) {
    const response = await api.post('/api/payments/create-order', data);
    return response.data;
  },

  async verifyPayment(data) {
    const response = await api.post('/api/payments/verify', data);
    return response.data;
  },

  async getPaymentStatus(paymentId) {
    const response = await api.get(`/api/payments/${paymentId}/status`);
    return response.data;
  },

  // Tenant Dashboard
  async getTenantDashboard(tenantId) {
    const response = await api.get(`/tenants/${tenantId}/dashboard`);
    return response.data;
  },
};

export default apiService;

