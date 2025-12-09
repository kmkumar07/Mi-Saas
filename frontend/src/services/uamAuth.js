import axios from 'axios';

const uamApi = axios.create({
  baseURL: import.meta.env.VITE_UAM_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getCurrentUser() {
  const response = await uamApi.get('/api/auth/me');
  return response.data;
}


