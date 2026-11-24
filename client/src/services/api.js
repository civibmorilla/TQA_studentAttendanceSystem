import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// When the session expires (tokens now last 1 day) or the account is deactivated,
// send the user back to the login page instead of leaving them on a broken screen.
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me/password');
    if (!isAuthCall && (status === 401 || (status === 403 && /deactivated/i.test(error.response?.data?.message || '')))) {
      ['token', 'userName', 'userRole', 'mustChangePassword', 'userPhoto'].forEach((k) => localStorage.removeItem(k));
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=1');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
