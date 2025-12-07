import api from './api';

export const NotificationsService = {
  registerPushToken: async (token: string) => {
    await api.post('/notifications/token', { token });
  },
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
};
