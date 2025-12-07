export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string[];
  rating: number;
  imageUrl: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}
