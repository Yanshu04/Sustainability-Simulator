import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Simulation API
export const simulationAPI = {
  list: () => api.get('/simulations'),
  get: (id) => api.get(`/simulations/${id}`),
  create: (data) => api.post('/simulations', data),
  update: (id, data) => api.put(`/simulations/${id}`, data),
  delete: (id) => api.delete(`/simulations/${id}`),
  getRecommendations: (id) => api.get(`/recommendations/${id}`),
};

export default api;
