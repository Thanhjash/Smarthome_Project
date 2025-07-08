import api from './api';

export const login = async (username: string, password: string) => {
  const response = await api.post('/api/login', { username, password });
  return response.data;
};

export const register = async (username: string, email: string, password: string, role: string) => {
  const response = await api.post('/api/register', { username, email, password, role });
  return response.data;
};
