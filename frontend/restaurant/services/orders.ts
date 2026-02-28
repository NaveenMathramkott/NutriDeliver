import api from './api';
import { Order } from '../types/orders';

export const OrdersService = {
  getOrders: async () => {
    const response = await api.get<Order[]>('/restaurants/restaurant/orders');
    return response.data;
  },
  getOrderDetails: async (id: string) => {
    const response = await api.get<Order>(`/restaurants/restaurant/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.patch<Order>(`/restaurants/restaurant/orders/${id}/status`, { status });
    return response.data;
  },
};
