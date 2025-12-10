import axios from 'axios';

const uamApi = axios.create({
  baseURL: import.meta.env.VITE_UAM_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global interceptor: if UAM says 401, redirect user to UAM login screen
uamApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const uamAppUrl = import.meta.env.VITE_UAM_APP_URL || 'http://localhost:4200';
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `${uamAppUrl}/auth/login?redirect=${redirectUrl}`;
      // We can still reject to allow callers to handle if needed
    }
    return Promise.reject(error);
  },
);

export async function getCurrentUser() {
  const response = await uamApi.get('/api/auth/me');
  return response.data;
}

export async function logout() {
  try {
    await uamApi.post('/api/auth/logout', {});
  } catch (_err) {
    // Ignore errors here; we just want to best-effort clear the session cookie.
  }
}


