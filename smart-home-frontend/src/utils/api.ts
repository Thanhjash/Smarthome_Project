import axios from 'axios';

// 🔥 FIXED: Point to backend server
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;