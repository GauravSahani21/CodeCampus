import axios from 'axios';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Automatic base URL detection: Use env var, or fallback based on environment
  config.baseURL = process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? 'http://localhost:5000/api' 
      : '/api');

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('cf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      sessionStorage.removeItem('cf_token');
      sessionStorage.removeItem('cf_user');
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
