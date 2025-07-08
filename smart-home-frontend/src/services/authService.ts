import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axios.post(`${API_URL}/users/login`, credentials);
    return response.data;
  },

  register: async (data: { username: string; email: string; password: string }) => {
    const response = await axios.post(`${API_URL}/users/register`, data);
    return response.data;
  },
};
