import axios from 'axios';

// Use local backend for development to avoid CORS and 404s until deployment
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Add a request interceptor to add the JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth failures globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('[AUTH_INTERCEPTOR] Session invalid or forbidden access. Purging token...');
      localStorage.removeItem('token');
      // Optional: window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
