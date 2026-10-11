// ─────────────────────────────────────────────
// Enums / Unions
// ─────────────────────────────────────────────
export type UserRole = "user" | "restaurant" | "rider" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "pickedup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "card" | "cash" | "digital_wallet";
export type AddressType = "home" | "work" | "other";

export type CuisineType =
  | "healthy"
  | "salads"
  | "protein"
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "keto"
  | "mediterranean"
  | "smoothies";

export type DietaryTag =
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "dairy-free"
  | "nut-free"
  | "low-carb"
  | "high-protein"
  | "keto"
  | "paleo"
  | "sugar-free"
  | "organic"
  | "non-gmo";

export type VehicleType = "bicycle" | "motorcycle" | "car" | "scooter";

// ─────────────────────────────────────────────
// Response envelopes
// ─────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface Pagination {
  current: number;
  pages: number;
  total: number;
}

export interface PaginatedResponse<T> {
  pagination: Pagination;
  [key: string]: T[] | Pagination;
}

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────
export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
}

export interface Address {
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: { lat: number; lng: number };
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RiderProfile {
  vehicleType: VehicleType;
  vehicleNumber: string;
  licenseNumber: string;
  isOnline: boolean;
  availabilityStatus: {
    status: "available" | "busy" | "offline";
    lastUpdated?: string;
  };
  currentLocation?: Coordinates & { lastUpdated: string };
  documents?: { type: string; url: string; uploadedAt: string }[];
  earnings: {
    totalEarnings: number;
    pendingPayout: number;
    totalDeliveries: number;
  };
}

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  profile: UserProfile & {
    lastLoginAt?: string;
  };
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    calorieGoal?: number;
  };
  addresses?: Address[];
  notificationPreferences?: { email: boolean; push: boolean; sms: boolean };
  restaurantProfile?: {
    restaurantId: string;
    roleInRestaurant: "owner";
    permissions: string[];
  };
  riderProfile?: RiderProfile;
  permissions?: string[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  _id: string;
  ownerId: string;
  name: string;
  description: string;
  cuisineType: CuisineType;
  contact: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates: Coordinates;
    };
  };
  operatingHours: { opening: string; closing: string; days: string[] };
  deliverySettings: {
    deliveryFee: number;
    minOrderAmount: number;
    deliveryRadius: number;
    estimatedDeliveryTime: number;
  };
  rating: number;
  totalReviews: number;
  images: string[];
  isActive: boolean;
  isVerified: boolean;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  _id: string;
  restaurantId:
    | string
    | Pick<Restaurant, "_id" | "name" | "rating" | "images" | "isOpen">;
  categoryId: string | { _id: string; name: string };
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  dietaryTags: DietaryTag[];
  preparationTime: number;
  images: string[];
  isAvailable: boolean;
  totalOrders: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  foodItemId: string | Partial<FoodItem>;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  customization?: { option: string; choice: string; price: number }[];
}

export interface Order {
  _id: string;
  orderId: string;
  userId: string | Partial<User>;
  restaurantId: string | Partial<Restaurant>;
  riderId?: string | Partial<User>;
  items: OrderItem[];
  orderTotal: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  deliveryAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  estimatedDelivery?: string;
  preparationTime?: number;
  specialInstructions?: string;
  rating?: number;
  review?: string;
  appliedOffer?: { offerId: string; code: string; discountAmount: number };
  deliveryDetails?: {
    riderId?: string;
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    estimatedPickupTime?: string;
    estimatedDeliveryTime?: string;
    riderLocationUpdates?: { coordinates: Coordinates; timestamp: string }[];
    deliveryProof?: { image?: string; signature?: string; notes?: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  foodItemId: string | Partial<FoodItem>;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  restaurantId?: string | Pick<Restaurant, "_id" | "name" | "images">;
  items: CartItem[];
  totalAmount: number;
  appliedOffer?: {
    offerId: string;
    code: string;
    discountAmount: number;
  } | null;
}

export interface Offer {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  applicableCategories: string[];
  applicableRestaurants: string[];
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "payment" | "promotion" | "system" | "delivery";
  isRead: boolean;
  relatedData?: Record<string, unknown>;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Admin Analytics
// ─────────────────────────────────────────────
export interface PlatformAnalytics {
  analytics: {
    users: {
      total: number;
      new: number;
      byRole: { _id: UserRole; count: number }[];
    };
    restaurants: {
      total: number;
      active: number;
      verified: number;
    };
    orders: {
      total: number;
      recent: number;
      byStatus: { _id: OrderStatus; count: number }[];
    };
    revenue: { totalRevenue: number; recentRevenue: number };
  };
}

export interface SalesAnalytics {
  /** Daily buckets keyed by YYYY-MM-DD. */
  salesOverTime: { _id: string; dailySales: number; orderCount: number }[];
  topRestaurants: {
    _id: string;
    totalSales: number;
    orderCount: number;
    /** Absent when the order's restaurant was deleted. */
    restaurant?: Restaurant;
  }[];
  popularItems: {
    _id: string;
    totalQuantity: number;
    totalRevenue: number;
    /** Absent when the ordered food item was deleted. */
    foodItem?: FoodItem;
  }[];
}

export interface UserAnalytics {
  userGrowth: { _id: string; newUsers: number }[];
  activeUsers: number;
  avgOrderValue: {
    _id: UserRole;
    avgOrderValue: number;
    totalOrders: number;
  }[];
}

export interface SystemSettings {
  settings: {
    platformName: string;
    supportEmail: string;
    defaultDeliveryFee: number;
    taxRate: number;
    maxDeliveryRadius: number;
    freeDeliveryThreshold: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    stripePublishableKey: string;
    stripeSecretKey: string;
    minOrderAmount: number;
    commissionRate: number;
    maxMenuItems: number;
    riderTimeout: number;
  };
}
