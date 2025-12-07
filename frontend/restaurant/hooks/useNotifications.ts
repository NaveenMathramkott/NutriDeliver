import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationsService } from '../services/notifications';

export const useNotifications = () => {
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await NotificationsService.registerPushToken(token);
    };

    registerForPushNotificationsAsync();
  }, []);

  return {};
};
