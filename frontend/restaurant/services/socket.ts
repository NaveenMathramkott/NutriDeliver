import { Config } from '../constants/Config';
import { NotificationService } from './notifications';

export const SocketService = {
  socket: null as WebSocket | null,

  connect: (restaurantId: string, onNewOrder?: (order: any) => void) => {
    // WebSocket URL derived from API URL
    const wsUrl = Config.API_URL.replace('http', 'ws') + `/ws/restaurant/${restaurantId}`;
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connected');
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'NEW_ORDER') {
          NotificationService.sendLocalNotification(
            'New Order Received!',
            `Order #${data.order.id.slice(-6).toUpperCase()} is waiting for acceptance.`,
            data.order
          );
          if (onNewOrder) onNewOrder(data.order);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        // Simple reconnect logic after 5 seconds
        setTimeout(() => SocketService.connect(restaurantId, onNewOrder), 5000);
      };

      SocketService.socket = ws;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  },

  disconnect: () => {
    if (SocketService.socket) {
      SocketService.socket.close();
      SocketService.socket = null;
    }
  },
};
