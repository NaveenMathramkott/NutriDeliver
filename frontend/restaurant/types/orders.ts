export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
}
