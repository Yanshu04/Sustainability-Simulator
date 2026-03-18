import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_URL =
  process.env.REACT_APP_API_URL ||
  (isLocalhost
    ? 'http://localhost:5000/api'
    : 'https://sustainability-simulator-api.onrender.com/api');

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

// Feature Showcase API
export const featureAPI = {
  compare: (simId1, simId2) => api.get(`/simulations/${simId1}/compare/${simId2}`),
  history: (simId) => api.get(`/simulations/${simId}/history`),
  recommendationsRanked: (simId) => api.get(`/simulations/${simId}/recommendations-ranked`),
  search: (params) => api.get('/simulations/search', { params }),
  exportCsv: (simId) => api.get(`/simulations/${simId}/export?format=csv`, { responseType: 'blob' }),
  listGoals: () => api.get('/goals'),
  createGoal: (payload) => api.post('/goals', payload),
  updateGoal: (goalId, payload) => api.patch(`/goals/${goalId}`, payload),
  deleteGoal: (goalId) => api.delete(`/goals/${goalId}`),
};

export { API_URL };
export default api;
