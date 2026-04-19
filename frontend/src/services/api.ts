import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('umbrella_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('umbrella_token');
      window.location.href = '/admin/connexion';
    }
    return Promise.reject(error);
  }
);

export default api;
