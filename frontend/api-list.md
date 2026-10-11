# NutriDeliver API Documentation

## Base URL

```
http://localhost:5000/api
```

**Swagger UI**: `http://localhost:5000/api-docs`
**OpenAPI JSON**: `http://localhost:5000/api-docs.json`

---

## Shared Types

```typescript
// ─────────────────────────────────────────────
// Enums / Unions
// ─────────────────────────────────────────────
type UserRole = 'user' | 'restaurant' | 'rider' | 'admin';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'pickedup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type PaymentMethod = 'card' | 'cash' | 'digital_wallet';
type AddressType = 'home' | 'work' | 'other';

type CuisineType =
  | 'healthy' | 'salads' | 'protein' | 'vegan' | 'vegetarian'
  | 'gluten-free' | 'keto' | 'mediterranean' | 'smoothies';

type DietaryTag =
  | 'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free'
  | 'low-carb' | 'high-protein' | 'keto' | 'paleo' | 'sugar-free'
  | 'organic' | 'non-gmo';

type VehicleType = 'bicycle' | 'motorcycle' | 'car' | 'scooter';

// ─────────────────────────────────────────────
// Response envelopes
// ─────────────────────────────────────────────
interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

interface PaginatedData<T> {
  pagination: Pagination;
  [key: string]: T[] | Pagination;
}

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────
interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
}

interface Address {
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: { lat: number; lng: number };
}

interface User {
  _id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    calorieGoal?: number;
  };
  addresses?: Address[];
  notificationPreferences?: { email: boolean; push: boolean; sms: boolean };
  restaurantProfile?: {
    restaurantId: string;
    roleInRestaurant: 'owner';
    permissions: string[];
  };
  riderProfile?: RiderProfile;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Coordinates { lat: number; lng: number }

interface RiderProfile {
  vehicleType: VehicleType;
  vehicleNumber: string;
  licenseNumber: string;
  isOnline: boolean;
  availabilityStatus: { status: 'available' | 'busy' | 'offline'; lastUpdated?: string };
  currentLocation?: Coordinates & { lastUpdated: string };
  documents?: { type: string; url: string; uploadedAt: string }[];
  earnings: {
    totalEarnings: number;
    pendingPayout: number;
    totalDeliveries: number;
  };
}

interface Restaurant {
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

interface FoodItem {
  _id: string;
  restaurantId: string | Pick<Restaurant, '_id' | 'name' | 'rating' | 'images' | 'isOpen'>;
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

interface OrderItem {
  foodItemId: string | Partial<FoodItem>;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  customization?: { option: string; choice: string; price: number }[];
}

interface Order {
  _id: string;
  orderId: string;                              // e.g. "ND-20261011-001"
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

interface CartItem {
  _id: string;
  foodItemId: string | Partial<FoodItem>;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface Cart {
  _id: string;
  userId: string;
  restaurantId?: string | Pick<Restaurant, '_id' | 'name' | 'images'>;
  items: CartItem[];
  totalAmount: number;
  appliedOffer?: { offerId: string; code: string; discountAmount: number } | null;
}

interface Offer {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
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

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'promotion' | 'system' | 'delivery';
  isRead: boolean;
  relatedData?: Record<string, unknown>;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}
```

---

## Authentication APIs (`/api/auth`)

| Method | Endpoint               | Auth     | Description                       |
| ------ | ---------------------- | -------- | --------------------------------- |
| POST   | `/register`            | Public   | Register a new user account       |
| POST   | `/login`               | Public   | Login user and return JWT tokens  |
| POST   | `/logout`              | Required | Logout user                       |
| POST   | `/refresh-token`       | Public   | Refresh access token              |
| POST   | `/forgot-password`     | Public   | Request password reset OTP        |
| POST   | `/verify-reset-otp`    | Public   | Verify OTP for password reset     |
| POST   | `/reset-password`      | Public   | Reset password using verified OTP |
| POST   | `/verify-email`        | Public   | Verify email address with OTP     |
| POST   | `/resend-verification` | Public   | Resend email verification OTP     |
| GET    | `/me`                  | Required | Get current authenticated user    |

### `POST /auth/register`

**Response `201`**
```typescript
ApiSuccess<{
  user: User;
  token: string;
  refreshToken: string;
}>
```

**Response `400`** — `ApiError`

---

### `POST /auth/login`

**Response `200`**
```typescript
ApiSuccess<{
  user: User;
  token: string;
  refreshToken: string;
}>
```

**Response `401`** — `ApiError` (`"Invalid email or password"`)

---

### `POST /auth/logout`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>   // data: {}
```

---

### `POST /auth/refresh-token`

**Request**: `{ refreshToken: string }`

**Response `200`**
```typescript
ApiSuccess<{ token: string }>
```

**Response `401`** — `ApiError`

---

### `POST /auth/forgot-password`

**Response `200`**
```typescript
ApiSuccess<{
  email: string;
  expiresIn: string;        // "10 minutes"
}>
```

**Response `404`** — `ApiError`

---

### `POST /auth/verify-reset-otp`

**Response `200`**
```typescript
ApiSuccess<{
  email: string;
  resetToken: string;
}>
```

**Response `400`** — `ApiError` (`"Invalid or expired OTP"`)

---

### `POST /auth/reset-password`

**Response `200`**
```typescript
ApiSuccess<{ email: string }>
```

**Response `400`** — `ApiError`

---

### `POST /auth/verify-email`

**Response `200`**
```typescript
ApiSuccess<{ email: string; isVerified: boolean }>
```

**Response `400`** — `ApiError`

---

### `POST /auth/resend-verification`

**Response `200`**
```typescript
ApiSuccess<{ email: string; expiresIn: string }>
```

**Response `404`** — `ApiError`

---

### `GET /auth/me`

**Response `200`**
```typescript
ApiSuccess<{ user: User }>
```

---

## User APIs (`/api/users`)

All routes require `Bearer` token.

| Method | Endpoint                    | Role | Description                     |
| ------ | --------------------------- | ---- | ------------------------------- |
| GET    | `/profile`                  | User | Get user profile information    |
| PUT    | `/profile`                  | User | Update user profile details     |
| PUT    | `/preferences`              | User | Update user preferences         |
| PUT    | `/notification-preferences` | User | Update notification preferences |
| GET    | `/addresses`                | User | Get all saved addresses         |
| POST   | `/addresses`                | User | Add a new delivery address      |
| PUT    | `/addresses/:addressId`     | User | Update specific address         |
| DELETE | `/addresses/:addressId`     | User | Delete specific address         |
| GET    | `/orders`                   | User | Get user's order history        |
| GET    | `/orders/:orderId`          | User | Get specific order details      |
| POST   | `/avatar`                   | User | Upload/update user avatar       |

### `GET /users/profile`

**Response `200`**
```typescript
ApiSuccess<{ user: User }>
```

---

### `PUT /users/profile`

**Response `200`**
```typescript
ApiSuccess<{ user: User }>
```

---

### `PUT /users/preferences`

**Response `200`**
```typescript
ApiSuccess<{
  preferences: {
    dietaryRestrictions: string[];
    allergies: string[];
    calorieGoal?: number;
  };
}>
```

---

### `PUT /users/notification-preferences`

**Response `200`**
```typescript
ApiSuccess<{
  notificationPreferences: { email: boolean; push: boolean; sms: boolean };
}>
```

---

### `GET /users/addresses`

**Response `200`**
```typescript
ApiSuccess<{ addresses: Address[] }>
```

---

### `POST /users/addresses`

**Response `201`**
```typescript
ApiSuccess<{ addresses: Address[] }>   // full updated list
```

---

### `PUT /users/addresses/:addressId`

**Response `200`**
```typescript
ApiSuccess<{ addresses: Address[] }>
```

**Response `404`** — `ApiError`

---

### `DELETE /users/addresses/:addressId`

**Response `200`**
```typescript
ApiSuccess<{ addresses: Address[] }>
```

---

### `GET /users/orders`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `GET /users/orders/:orderId`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `404`** — `ApiError`

---

### `POST /users/avatar` *(multipart/form-data)*

**Response `200`**
```typescript
ApiSuccess<{ user: User }>
```

---

## Restaurant APIs (`/api/restaurants`)

| Method | Endpoint                              | Auth     | Role       | Description                        |
| ------ | ------------------------------------- | -------- | ---------- | ---------------------------------- |
| GET    | `/`                                   | Public   | -          | Get all restaurants (with filters) |
| GET    | `/:id`                                | Public   | -          | Get restaurant by ID               |
| GET    | `/:id/menu`                           | Public   | -          | Get restaurant menu                |
| GET    | `/:id/status`                         | Public   | -          | Get open status & operating hours  |
| POST   | `/:id/check-delivery`                 | Public   | -          | Check delivery availability & fee  |
| GET    | `/restaurant`                         | Required | Restaurant | Get own restaurant profile         |
| POST   | `/`                                   | Required | Restaurant | Create new restaurant              |
| PUT    | `/restaurant`                         | Required | Restaurant | Update own restaurant              |
| PUT    | `/restaurant/toggle-status`           | Required | Restaurant | Toggle open/closed status          |
| GET    | `/restaurant/orders`                  | Required | Restaurant | Get restaurant's orders            |
| POST   | `/restaurant/orders/:orderId/respond` | Required | Restaurant | Accept/reject new order            |
| PUT    | `/restaurant/orders/:orderId/status`  | Required | Restaurant | Update order status                |
| GET    | `/restaurant/analytics`               | Required | Restaurant | Get restaurant analytics           |
| POST   | `/restaurant/images`                  | Required | Restaurant | Upload restaurant images           |

### `GET /restaurants`

**Query**: `page`, `limit`, `cuisineType`, `minRating`, `search`, `sortBy`, `sortOrder`, `isOpen`

**Response `200`**
```typescript
ApiSuccess<{
  restaurants: Restaurant[];
  pagination: Pagination;
}>
```

---

### `GET /restaurants/:id`

**Response `200`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

**Response `404`** — `ApiError`

---

### `GET /restaurants/:id/menu`

**Response `200`**
```typescript
ApiSuccess<{ menu: FoodItem[] }>
```

---

### `GET /restaurants/:id/status`

**Response `200`**
```typescript
ApiSuccess<{
  isOpen: boolean;
  operatingHours: { opening: string; closing: string; days: string[] };
  deliverySettings: Restaurant['deliverySettings'];
}>
```

---

### `POST /restaurants/:id/check-delivery`

**Request**: `{ lat: number; lng: number }`

**Response `200`**
```typescript
ApiSuccess<{
  canDeliver: boolean;
  distance: number;                      // km, 2 decimal places
  deliveryRadius: number;                // km
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: number;         // minutes
  message: string;
}>
```

**Response `400`/`404`** — `ApiError`

---

### `GET /restaurants/restaurant`

**Response `200`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

**Response `404`** — `ApiError`

---

### `POST /restaurants`

**Response `201`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

**Response `400`** — `ApiError`

---

### `PUT /restaurants/restaurant`

**Response `200`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

---

### `PUT /restaurants/restaurant/toggle-status`

**Response `200`**
```typescript
ApiSuccess<{ isOpen: boolean }>
```

---

### `GET /restaurants/restaurant/orders`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `POST /restaurants/restaurant/orders/:orderId/respond`

**Request**: `{ action: 'accept' | 'reject'; rejectionReason?: string }`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `400`** — `ApiError` (`"Order cannot be accepted at this stage"`)

---

### `PUT /restaurants/restaurant/orders/:orderId/status`

**Request**: `{ status: 'confirmed' | 'preparing' | 'ready_for_pickup' | 'cancelled' }`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `400`** — `ApiError` (`"Invalid status transition from pending to delivered"`)

---

### `GET /restaurants/restaurant/analytics`

**Response `200`**
```typescript
ApiSuccess<{
  analytics: {
    totalOrders: number;
    totalRevenue: number;
    recentOrders: number;                                  // last 30 days
    popularItems: {
      _id: string;
      totalQuantity: number;
      totalRevenue: number;
      foodItem: FoodItem;
    }[];
  };
}>
```

---

### `POST /restaurants/restaurant/images` *(multipart/form-data)*

**Response `200`**
```typescript
ApiSuccess<{ images: string[] }>
```

---

## Food APIs (`/api/food`)

| Method | Endpoint                    | Auth     | Role       | Description                        |
| ------ | --------------------------- | -------- | ---------- | ---------------------------------- |
| GET    | `/`                         | Optional | -          | Get food items (open restaurants)  |
| GET    | `/categories`               | Public   | -          | Get all food categories            |
| GET    | `/search`                   | Public   | -          | Search food items                  |
| GET    | `/:id`                      | Public   | -          | Get food item by ID                |
| GET    | `/restaurant/:restaurantId` | Public   | -          | Get food items for a restaurant    |
| POST   | `/`                         | Required | Restaurant | Create new food item               |
| PUT    | `/:id`                      | Required | Restaurant | Update food item                   |
| DELETE | `/:id`                      | Required | Restaurant | Delete food item                   |
| PATCH  | `/:id/availability`         | Required | Restaurant | Toggle food item availability      |
| POST   | `/:id/images`               | Required | Restaurant | Upload food item images            |

### `GET /food`

**Response `200`**
```typescript
ApiSuccess<{
  foodItems: FoodItem[];
  pagination: Pagination;
}>
```

---

### `GET /food/categories`

**Response `200`**
```typescript
ApiSuccess<{ categories: Category[] }>
```

---

### `GET /food/search`

**Query**: `q` (required), `category`, `maxCalories`, `dietary`

**Response `200`**
```typescript
ApiSuccess<{
  foodItems: FoodItem[];
  count: number;
}>
```

**Response `400`** — `ApiError`

---

### `GET /food/:id`

**Response `200`**
```typescript
ApiSuccess<{ foodItem: FoodItem }>
```

**Response `404`** — `ApiError`

---

### `GET /food/restaurant/:restaurantId`

**Response `200`**
```typescript
ApiSuccess<{ foodItems: FoodItem[] }>
```

**Response `400`** — `ApiError` (restaurant closed/inactive)

---

### `POST /food`

**Response `201`**
```typescript
ApiSuccess<{ foodItem: FoodItem }>
```

---

### `PUT /food/:id`

**Response `200`**
```typescript
ApiSuccess<{ foodItem: FoodItem }>
```

---

### `DELETE /food/:id`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>   // data: {}
```

---

### `PATCH /food/:id/availability`

**Response `200`**
```typescript
ApiSuccess<{ foodItem: FoodItem }>   // foodItem.isAvailable reflects new value
```

---

### `POST /food/:id/images` *(multipart/form-data)*

**Response `200`**
```typescript
ApiSuccess<{ images: string[] }>
```

---

## Cart APIs (`/api/cart`)

All routes require `user` role.

| Method | Endpoint           | Description                       |
| ------ | ------------------ | --------------------------------- |
| GET    | `/`                | Get user's cart                   |
| POST   | `/add`             | Add item to cart                  |
| PUT    | `/update/:itemId`  | Update cart item quantity         |
| DELETE | `/remove/:itemId`  | Remove item from cart             |
| DELETE | `/clear`           | Clear entire cart                 |
| POST   | `/apply-offer`     | Apply offer/discount to cart      |

### `GET /cart`

> Unavailable food items are auto-removed from the cart before responding.

**Response `200`**
```typescript
ApiSuccess<{ cart: Cart }>
```

---

### `POST /cart/add`

**Request**: `{ foodItemId: string; quantity: number; specialInstructions?: string }`

**Response `200`**
```typescript
ApiSuccess<{ cart: Cart }>
```

**Response `400`** — `ApiError` (item unavailable / cart belongs to another restaurant)

---

### `PUT /cart/update/:itemId`

**Response `200`**
```typescript
ApiSuccess<{ cart: Cart }>
```

**Response `404`** — `ApiError`

---

### `DELETE /cart/remove/:itemId`

**Response `200`**
```typescript
ApiSuccess<{ cart: Cart }>
```

---

### `DELETE /cart/clear`

**Response `200`**
```typescript
ApiSuccess<{ cart: Cart }>   // empty items array, totalAmount: 0
```

---

### `POST /cart/apply-offer`

**Request**: `{ code: string }`

**Response `200`**
```typescript
ApiSuccess<{
  discount: number;
  finalAmount: number;
}>
```

**Response `400`** — `ApiError` (invalid/expired code, min order not met, usage limit reached)

---

## Order APIs (`/api/orders`)

| Method | Endpoint                          | Role       | Description                       |
| ------ | --------------------------------- | ---------- | --------------------------------- |
| POST   | `/`                               | User       | Create new order                  |
| GET    | `/`                               | User       | Get user's orders                 |
| GET    | `/:orderId`                       | Any        | Get order by ID                   |
| PUT    | `/:orderId/cancel`                | User       | Cancel order                      |
| POST   | `/:orderId/rate`                  | User       | Rate completed order              |
| GET    | `/restaurant/orders`              | Restaurant | Get restaurant's orders           |
| PUT    | `/:orderId/status`                | Restaurant | Update order status               |
| GET    | `/rider/available`                | Rider      | Get available delivery orders     |
| GET    | `/rider/my-orders`                | Rider      | Get rider's assigned orders       |
| POST   | `/:orderId/accept`                | Rider      | Accept delivery order             |
| POST   | `/:orderId/reject`                | Rider      | Reject delivery order             |
| PUT    | `/:orderId/location`              | Rider      | Update delivery location          |
| POST   | `/:orderId/confirm-pickup`        | Rider      | Confirm order pickup              |
| POST   | `/:orderId/confirm-delivery`      | Rider      | Confirm order delivery            |

### `POST /orders`

> Validates: restaurant open, minimum order amount, delivery radius. Items are read from the **cart**, not the request body.

**Response `201`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `400`** — `ApiError`
- `"Cart is empty"`
- `"Item \"X\" is no longer available"`
- `"Restaurant is currently closed"`
- `"Minimum order amount is $15"`
- `"Delivery address is outside the restaurant's delivery radius (10km)"`

---

### `GET /orders`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `GET /orders/:orderId`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>   // populated with restaurant, items, user, rider
```

**Response `404`** — `ApiError`

---

### `PUT /orders/:orderId/cancel`

> Allowed only when `status` is `pending` or `confirmed`.

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `400`** — `ApiError` (`"Order cannot be cancelled at this stage"`)

---

### `POST /orders/:orderId/rate`

**Request**: `{ rating: 1|2|3|4|5; review?: string }`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `400`** — `ApiError` (order not delivered / rating out of range)

---

### `GET /orders/restaurant/orders`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `PUT /orders/:orderId/status`

> Validated transitions: `confirmed → preparing → ready_for_pickup → cancelled`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

**Response `400`** — `ApiError` (`"Invalid status transition from preparing to delivered"`)

---

### `GET /orders/rider/available`

**Query**: `lat` (required), `lng` (required), `maxDistance` (default 10)

**Response `200`**
```typescript
ApiSuccess<{
  orders: {
    _id: string;
    orderId: string;
    grandTotal: number;
    deliveryFee: number;
    deliveryAddress: Address;
    estimatedDelivery?: string;
    preparationTime: number;
    distance: number;                  // degrees approximation
    restaurant: { name: string; contact: { address: Restaurant['contact']['address'] } };
  }[];
}>
```

**Response `400`** — `ApiError`

---

### `GET /orders/rider/my-orders`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `POST /orders/:orderId/accept`

> Only matches orders with `status: 'ready_for_pickup'` and no assigned rider (atomic claim).

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>   // status: 'pickedup', deliveryDetails.riderId set
```

**Response `400`** — `ApiError` (`"Order not available for delivery"`)

---

### `POST /orders/:orderId/reject`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>   // data: {}
```

---

### `PUT /orders/:orderId/location`

**Request**: `{ lat: number; lng: number }`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

**Response `404`** — `ApiError`

---

### `POST /orders/:orderId/confirm-pickup`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>   // status: 'out_for_delivery'
```

---

### `POST /orders/:orderId/confirm-delivery`

**Request**: `{ image?: string; signature?: string; notes?: string }`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>   // status: 'delivered', deliveryProof populated
```

---

## Payment APIs (`/api/payments`)

| Method | Endpoint              | Role             | Description                    |
| ------ | --------------------- | ---------------- | ------------------------------ |
| POST   | `/create-intent`      | User             | Create payment intent (Stripe) |
| POST   | `/confirm`            | User             | Confirm payment                |
| GET    | `/methods`            | User             | Get saved payment methods      |
| POST   | `/methods`            | User             | Add new payment method         |
| DELETE | `/methods/:methodId`  | User             | Remove payment method          |
| GET    | `/history`            | User             | Get payment history            |
| POST   | `/refund`             | Admin/Restaurant | Process refund                 |

### `POST /payments/create-intent`

**Response `200`**
```typescript
ApiSuccess<{
  clientSecret: string;
  paymentIntentId: string;
}>
```

---

### `POST /payments/confirm`

**Response `200`**
```typescript
ApiSuccess<{
  paymentStatus: PaymentStatus;
  orderId: string;
}>
```

**Response `400`** — `ApiError`

---

### `GET /payments/methods`

**Response `200`**
```typescript
ApiSuccess<{ paymentMethods: [] }>   // empty array until Stripe methods are persisted
```

---

### `POST /payments/methods`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

### `DELETE /payments/methods/:methodId`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

### `GET /payments/history`

**Response `200`**
```typescript
ApiSuccess<{
  payments: (Order & { paymentStatus: PaymentStatus; grandTotal: number })[];
  pagination: Pagination;
}>
```

---

### `POST /payments/refund`

**Response `200`**
```typescript
ApiSuccess<{
  refundId: string;
  orderId: string;
  amount: number;
}>
```

---

## Offer APIs (`/api/offers`)

| Method | Endpoint      | Auth     | Role  | Description                         |
| ------ | ------------- | -------- | ----- | ----------------------------------- |
| GET    | `/`           | Optional | -     | Get active offers                   |
| GET    | `/:id`        | Public   | -     | Get offer by ID                     |
| POST   | `/validate`   | Required | User  | Validate offer code                 |
| GET    | `/admin/all`  | Required | Admin | Get all offers (including inactive) |
| POST   | `/`           | Required | Admin | Create new offer                    |
| PUT    | `/:id`        | Required | Admin | Update offer                        |
| DELETE | `/:id`        | Required | Admin | Delete offer                        |

### `GET /offers`

**Response `200`**
```typescript
ApiSuccess<{ offers: Offer[] }>
```

---

### `GET /offers/:id`

**Response `200`**
```typescript
ApiSuccess<{ offer: Offer }>
```

**Response `404`** — `ApiError`

---

### `POST /offers/validate`

**Request**: `{ code: string; orderTotal: number; restaurantId?: string }`

**Response `200`**
```typescript
ApiSuccess<{
  valid: true;
  offer: {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscount?: number;
  };
  discountAmount: number;
}>
```

**Response `400`** — `ApiError`

---

### `GET /offers/admin/all`

**Response `200`**
```typescript
ApiSuccess<{
  offers: Offer[];
  pagination: Pagination;
}>
```

---

### `POST /offers`

**Response `201`**
```typescript
ApiSuccess<{ offer: Offer }>
```

---

### `PUT /offers/:id`

**Response `200`**
```typescript
ApiSuccess<{ offer: Offer }>
```

---

### `DELETE /offers/:id`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

## Notification APIs (`/api/notifications`)

| Method | Endpoint         | Description                      |
| ------ | ---------------- | -------------------------------- |
| GET    | `/`              | Get user notifications           |
| GET    | `/unread-count`  | Get unread notification count    |
| PUT    | `/:id/read`      | Mark notification as read        |
| PUT    | `/read-all`      | Mark all notifications as read   |
| DELETE | `/:id`           | Delete notification              |
| PUT    | `/preferences`   | Update notification preferences  |

### `GET /notifications`

**Response `200`**
```typescript
ApiSuccess<{
  notifications: Notification[];
  pagination: Pagination;
}>
```

---

### `GET /notifications/unread-count`

**Response `200`**
```typescript
ApiSuccess<{ count: number }>
```

---

### `PUT /notifications/:id/read`

**Response `200`**
```typescript
ApiSuccess<{ notification: Notification }>
```

---

### `PUT /notifications/read-all`

**Response `200`**
```typescript
ApiSuccess<{ updatedCount: number }>
```

---

### `DELETE /notifications/:id`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

### `PUT /notifications/preferences`

**Response `200`**
```typescript
ApiSuccess<{
  notificationPreferences: { email: boolean; push: boolean; sms: boolean };
}>
```

---

## Rider APIs (`/api/riders`)

| Method | Endpoint                            | Auth     | Description                   |
| ------ | ----------------------------------- | -------- | ----------------------------- |
| POST   | `/register`                         | Public   | Register as a rider           |
| GET    | `/profile`                          | Required | Get rider profile             |
| PUT    | `/profile`                          | Required | Update rider profile          |
| POST   | `/documents`                        | Required | Upload rider documents        |
| PUT    | `/availability`                     | Required | Update online/offline status  |
| PUT    | `/location`                         | Required | Update current location       |
| GET    | `/orders/available`                 | Required | Get available delivery orders |
| POST   | `/orders/:orderId/accept`           | Required | Accept delivery order         |
| POST   | `/orders/:orderId/reject`           | Required | Reject delivery order         |
| GET    | `/orders/current`                   | Required | Get current active delivery   |
| GET    | `/orders/history`                   | Required | Get delivery history          |
| POST   | `/orders/:orderId/confirm-pickup`   | Required | Confirm order pickup          |
| POST   | `/orders/:orderId/confirm-delivery` | Required | Confirm order delivery        |
| GET    | `/earnings`                         | Required | Get earnings (all time)       |
| GET    | `/earnings/:period`                 | Required | Get earnings for period       |
| GET    | `/stats`                            | Required | Get rider statistics          |
| GET    | `/ratings`                          | Required | Get rider ratings             |

### `POST /riders/register`

**Response `201`**
```typescript
ApiSuccess<{
  user: User;
  message: string;      // "Rider registration submitted for verification"
}>
```

---

### `GET /riders/profile`

**Response `200`**
```typescript
ApiSuccess<{ rider: User & { riderProfile: RiderProfile } }>
```

---

### `PUT /riders/profile`

**Response `200`**
```typescript
ApiSuccess<{ rider: User & { riderProfile: RiderProfile } }>
```

---

### `POST /riders/documents` *(multipart/form-data)*

**Response `200`**
```typescript
ApiSuccess<{
  documents: { type: string; url: string; uploadedAt: string }[];
}>
```

---

### `PUT /riders/availability`

**Request**: `{ status: 'available' | 'offline' }`

**Response `200`**
```typescript
ApiSuccess<{
  availability: { status: 'available' | 'busy' | 'offline'; lastUpdated?: string };
}>
```

---

### `PUT /riders/location`

**Response `200`**
```typescript
ApiSuccess<{
  location: Coordinates & { lastUpdated: string };
}>
```

---

### `GET /riders/orders/available`

**Response `200`**
```typescript
ApiSuccess<{
  orders: {
    _id: string;
    orderId: string;
    grandTotal: number;
    deliveryFee: number;
    distance: number;
    restaurant: Pick<Restaurant, '_id' | 'name'> & { contact: Restaurant['contact'] };
    deliveryAddress: Address;
  }[];
}>
```

---

### `POST /riders/orders/:orderId/accept`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

---

### `POST /riders/orders/:orderId/reject`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

### `GET /riders/orders/current`

**Response `200`**
```typescript
ApiSuccess<{ order: Order | null }>
```

---

### `GET /riders/orders/history`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `POST /riders/orders/:orderId/confirm-pickup`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

---

### `POST /riders/orders/:orderId/confirm-delivery`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

---

### `GET /riders/earnings`

**Response `200`**
```typescript
ApiSuccess<{
  earnings: { totalEarnings: number; totalDeliveries: number; averageEarning: number };
  currentBalance: RiderProfile['earnings'];
}>
```

---

### `GET /riders/earnings/:period`

**Period**: `daily` | `weekly` | `monthly` | `yearly`

**Response `200`**
```typescript
ApiSuccess<{
  period: string;
  earnings: { totalEarnings: number; totalDeliveries: number; averageEarning: number };
}>
```

---

### `GET /riders/stats`

**Response `200`**
```typescript
ApiSuccess<{
  stats: {
    totalDeliveries: number;
    completionRate: number;         // percentage
    averageDeliveryTime: number;    // minutes
  };
}>
```

---

### `GET /riders/ratings`

**Response `200`**
```typescript
ApiSuccess<{
  ratings: (Order & { rating: number; review?: string })[];
  averageRating: number;
  totalRatings: number;
  pagination: Pagination;
}>
```

---

## Admin APIs (`/api/admin`)

All routes require `admin` role.

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| GET    | `/users`                   | Get all users             |
| GET    | `/users/:id`               | Get user by ID            |
| PUT    | `/users/:id/status`        | Update user status        |
| DELETE | `/users/:id`               | Delete user               |
| GET    | `/restaurants`             | Get all restaurants       |
| GET    | `/restaurants/:id`         | Get restaurant by ID      |
| PUT    | `/restaurants/:id/verify`  | Verify restaurant         |
| PUT    | `/restaurants/:id/status`  | Update restaurant status  |
| GET    | `/riders`                  | Get all riders            |
| GET    | `/riders/:id`              | Get rider by ID           |
| PUT    | `/riders/:id/verify`       | Verify rider              |
| PUT    | `/riders/:id/status`       | Update rider status       |
| GET    | `/orders`                  | Get all orders            |
| GET    | `/orders/:id`              | Get order by ID           |
| PUT    | `/orders/:id`              | Update order              |
| POST   | `/categories`              | Create category           |
| PUT    | `/categories/:id`          | Update category           |
| DELETE | `/categories/:id`          | Delete category           |
| GET    | `/analytics/platform`      | Get platform analytics    |
| GET    | `/analytics/sales`         | Get sales analytics       |
| GET    | `/analytics/users`         | Get user analytics        |
| GET    | `/settings`                | Get system settings       |
| PUT    | `/settings`                | Update system settings    |

### `GET /admin/users`

**Response `200`**
```typescript
ApiSuccess<{
  users: User[];
  pagination: Pagination;
}>
```

---

### `GET /admin/users/:id`

**Response `200`**
```typescript
ApiSuccess<{ user: User }>
```

---

### `PUT /admin/users/:id/status`

**Request**: `{ isActive: boolean }`

**Response `200`**
```typescript
ApiSuccess<{ user: User }>
```

---

### `DELETE /admin/users/:id`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

### `GET /admin/restaurants`

**Response `200`**
```typescript
ApiSuccess<{
  restaurants: Restaurant[];
  pagination: Pagination;
}>
```

---

### `GET /admin/restaurants/:id`

**Response `200`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

---

### `PUT /admin/restaurants/:id/verify`

**Request**: `{ isVerified: boolean }`

**Response `200`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

---

### `PUT /admin/restaurants/:id/status`

**Request**: `{ isActive: boolean }`

**Response `200`**
```typescript
ApiSuccess<{ restaurant: Restaurant }>
```

---

### `GET /admin/riders`

**Response `200`**
```typescript
ApiSuccess<{
  riders: (User & { riderProfile: RiderProfile })[];
  pagination: Pagination;
}>
```

---

### `GET /admin/riders/:id`

**Response `200`**
```typescript
ApiSuccess<{ rider: User & { riderProfile: RiderProfile } }>
```

---

### `PUT /admin/riders/:id/verify`

**Request**: `{ isVerified: boolean }`

**Response `200`**
```typescript
ApiSuccess<{ rider: User & { riderProfile: RiderProfile } }>
```

---

### `PUT /admin/riders/:id/status`

**Request**: `{ isActive: boolean }`

**Response `200`**
```typescript
ApiSuccess<{ rider: User & { riderProfile: RiderProfile } }>
```

---

### `GET /admin/orders`

**Response `200`**
```typescript
ApiSuccess<{
  orders: Order[];
  pagination: Pagination;
}>
```

---

### `GET /admin/orders/:id`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

---

### `PUT /admin/orders/:id`

**Response `200`**
```typescript
ApiSuccess<{ order: Order }>
```

---

### `POST /admin/categories`

**Response `201`**
```typescript
ApiSuccess<{ category: Category }>
```

---

### `PUT /admin/categories/:id`

**Response `200`**
```typescript
ApiSuccess<{ category: Category }>
```

---

### `DELETE /admin/categories/:id`

**Response `200`**
```typescript
ApiSuccess<Record<string, never>>
```

---

### `GET /admin/analytics/platform`

**Response `200`**
```typescript
ApiSuccess<{
  analytics: {
    users: {
      total: number;
      new: number;                              // last 30 days
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
}>
```

---

### `GET /admin/analytics/sales`

**Query**: `period` = `week` | `month` | `year` (default `month`)

**Response `200`**
```typescript
ApiSuccess<{
  salesOverTime: { _id: string; orders: number; revenue: number }[];
  topRestaurants: { _id: string; orders: number; revenue: number; restaurant: Restaurant }[];
  popularItems: { _id: string; totalQuantity: number; totalRevenue: number; foodItem: FoodItem }[];
}>
```

---

### `GET /admin/analytics/users`

**Response `200`**
```typescript
ApiSuccess<{
  userGrowth: { _id: string; newUsers: number }[];       // grouped by date
  activeUsers: number;                                    // ordered in last 30 days
  avgOrderValue: { _id: UserRole; avgOrderValue: number; totalOrders: number }[];
}>
```

---

### `GET /admin/settings`

**Response `200`**
```typescript
ApiSuccess<{
  settings: {
    platformName: string;
    supportEmail: string;
    defaultDeliveryFee: number;
    taxRate: number;
    maxDeliveryRadius: number;
  };
}>
```

---

### `PUT /admin/settings`

**Response `200`**
```typescript
ApiSuccess<{
  settings: {
    platformName: string;
    supportEmail: string;
    defaultDeliveryFee: number;
    taxRate: number;
    maxDeliveryRadius: number;
  };
}>
```

---

## Health Check

| Method | Endpoint  | Auth   | Description           |
| ------ | --------- | ------ | --------------------- |
| GET    | `/health` | Public | Health check endpoint |

### `GET /health`

**Response `200`**
```typescript
{
  success: true;
  message: string;      // "🚀 NutriDeliver Backend is running successfully!"
  timestamp: string;    // ISO 8601
  version: string;      // "1.0.0"
}
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Payment endpoints**: 30 requests per 15 minutes

---

## Authentication Headers

All protected routes require:

```
Authorization: Bearer <access_token>
```

---

## Response Formats

**Success**
```typescript
{ success: true; message: string; data: T }
```

**Error**
```typescript
{ success: false; message: string; errors?: { field: string; message: string }[] }
```

**Paginated (list endpoints)**
```typescript
{ success: true; data: { <collection>: T[]; pagination: { current; pages; total } } }
```

---

## Order Status Flow

```
pending → confirmed → preparing → ready_for_pickup → pickedup → out_for_delivery → delivered
     ↓         ↓            ↓               ↓             ↓              ↓
  cancelled (allowed from any state before delivered)
```

### Valid Transitions by Role

| Role       | Allowed Transitions                                              |
| ---------- | ---------------------------------------------------------------- |
| Customer   | `pending → cancelled`, `confirmed → cancelled`                    |
| Restaurant | `pending → confirmed`, `confirmed → preparing`, `preparing → ready_for_pickup`, `* → cancelled` |
| Rider      | `ready_for_pickup → pickedup`, `pickedup → out_for_delivery`, `out_for_delivery → delivered` |
| System     | `ready_for_pickup → cancelled` (auto after 10 min, no rider)     |

---

## Key Business Rules

1. **Restaurant must be open** to receive orders (checked via `isOpen` + `operatingHours`).
2. **Minimum order amount** enforced per restaurant before order creation.
3. **Delivery radius** validated via Haversine distance calculation before order creation.
4. **Auto-cancel**: Orders in `ready_for_pickup` for >10 minutes without a rider are auto-cancelled (background job, 5-min interval).
5. **Restaurant must accept** the order (`pending → confirmed`) before preparing.
6. **Food items hidden** from closed restaurants in all public listings (`/food`, `/food/search`).
7. **Rider assignment** is atomic — `findOneAndUpdate` prevents two riders claiming the same order.
8. **Rider status** auto-updates: `busy` on accept, `available` on delivery confirm.