import axios from 'axios';

const api = axios.create({
  baseURL: 'https://maprent-1.onrender.com/api',
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
