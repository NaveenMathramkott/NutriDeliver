import api from './api';
import { Restaurant, MenuItem } from '../types/restaurant';

export const RestaurantService = {
  getProfile: async () => {
    const response = await api.get<Restaurant>('/restaurant/profile');
    return response.data;
  },
  updateProfile: async (data: Partial<Restaurant>) => {
    const response = await api.put<Restaurant>('/restaurant/profile', data);
    return response.data;
  },
  getMenu: async () => {
    const response = await api.get<MenuItem[]>('/restaurant/menu');
    return response.data;
  },
  addMenuItem: async (item: Omit<MenuItem, 'id'>) => {
    const response = await api.post<MenuItem>('/restaurant/menu', item);
    return response.data;
  },
  updateMenuItem: async (id: string, item: Partial<MenuItem>) => {
    const response = await api.put<MenuItem>(`/restaurant/menu/${id}`, item);
    return response.data;
  },
  deleteMenuItem: async (id: string) => {
    await api.delete(`/restaurant/menu/${id}`);
  },
  getAnalyticsDaily: async () => {
    const response = await api.get('/restaurant/analytics/daily');
    return response.data;
  },
  getAnalyticsWeekly: async () => {
    const response = await api.get('/restaurant/analytics/weekly');
    return response.data;
  },
  getEarnings: async () => {
    const response = await api.get('/restaurant/earnings');
    return response.data;
  },
  getPopularItems: async () => {
    const response = await api.get('/restaurant/popular-items');
    return response.data;
  },
  updateOperatingHours: async (hours: any) => {
    const response = await api.put('/restaurant/operating-hours', hours);
    return response.data;
  },
  uploadImage: async (formData: FormData) => {
    const response = await api.post('/restaurant/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
