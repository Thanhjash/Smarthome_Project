import api from './api';

// 🔥 FIXED: Complete auth utilities with token handling
export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  
  // Store tokens in localStorage
  if (response.data.backendToken) {
    localStorage.setItem('token', response.data.backendToken);
    localStorage.setItem('user', JSON.stringify({
      userId: response.data.userId,
      username: response.data.username,
      email: response.data.email,
      role: response.data.role
    }));
  }
  
  return response.data;
};

// 🔥 FIXED: Remove role parameter (backend defaults to 'user')
export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

// 🔥 NEW: Exchange Firebase token
export const exchangeToken = async (firebaseToken: string) => {
  const response = await api.post('/auth/exchange-token', { firebaseToken });
  return response.data;
};

// 🔥 NEW: Forgot password
export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// 🔥 NEW: Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// 🔥 NEW: Get auth token
export const getToken = () => {
  return localStorage.getItem('token');
};

// 🔥 NEW: Logout function
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 🔥 NEW: Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// 🔥 NEW: Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};