import api from './api';
import { User } from '../types/auth';

export const AuthService = {
  login: async (credentials: any) => {
    const response = await api.post<{ success: boolean, data: { user: User; token: string } }>('/auth/login', credentials);
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post<{ success: boolean, data: { user: User; token: string } }>('/auth/register', data);
    return response.data;
  },
  logout: async () => {
    // Optional: Call backend to invalidate token
    return Promise.resolve();
  },
  getCurrentUser: async () => {
    const response = await api.get<{ success: boolean, data: { user: User } }>('/auth/me');
    return response.data;
  },
};
