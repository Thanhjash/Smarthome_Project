import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  },

  register: async (data: { username: string; email: string; password: string }) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  },
};
