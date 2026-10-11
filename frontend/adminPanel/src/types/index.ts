export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "user" | "restaurant" | "rider" | "admin";
  status: "active" | "inactive" | "banned";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string[];
  image?: string;
  coverImage?: string;
  isOpen: boolean;
  isVerified: boolean;
  status: "active" | "inactive" | "pending" | "rejected";
  rating: number;
  deliveryFee: number;
  minOrderAmount: number;
  deliveryRadius: number;
  operatingHours: OperatingHours;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: string;
  images?: string[];
  restaurantId: string;
  restaurantName: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  preparationTime: number;
  calories?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  restaurantId: string;
  restaurantName: string;
  riderId?: string;
  riderName?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryAddress: Address;
  notes?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "pickedup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  label?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  method: "card" | "wallet" | "cash" | "upi";
  status: PaymentStatus;
  transactionId?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "free_delivery";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount: number;
  userLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableRestaurants?: string[];
  applicableCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "promotion" | "system" | "payment" | "delivery";
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  vehicleType: "bicycle" | "motorcycle" | "car" | "scooter";
  vehicleNumber: string;
  licenseNumber: string;
  status: "available" | "busy" | "offline";
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  earnings: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  documents: RiderDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface RiderDocument {
  id: string;
  type: "license" | "vehicle_registration" | "insurance" | "id_proof";
  url: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "manager" | "support";
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  overview: {
    totalUsers: number;
    totalRestaurants: number;
    totalRiders: number;
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  sales: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  users: {
    date: string;
    newUsers: number;
    activeUsers: number;
  }[];
  topRestaurants: {
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }[];
  topCategories: {
    category: string;
    orders: number;
    revenue: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
