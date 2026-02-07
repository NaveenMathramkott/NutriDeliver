import { useEffect } from 'react';
import { SocketService } from '../services/socket';
import { useAuth } from './useAuth';
import { NotificationService } from '../services/notifications';

export const useRestaurantSocket = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.id) {
      NotificationService.setup();
      SocketService.connect(user.id, (newOrder) => {
        console.log('New Order Notification:', newOrder);
        // You can trigger a global state update here (e.g. Redux/Zustand)
      });
    }

    return () => {
      SocketService.disconnect();
    };
  }, [user]);
};
