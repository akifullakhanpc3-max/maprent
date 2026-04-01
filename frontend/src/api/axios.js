import axios from 'axios';

export const BASE_URL = 'https://maprent-1.onrender.com';

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

export default api;
