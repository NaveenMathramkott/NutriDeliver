# NutriDeliver API Documentation

## Base URL

```
http://localhost:8000/api
```

---

## Authentication APIs (`/api/auth`)

| Method | Endpoint               | Auth     | Description                              |
| ------ | ---------------------- | -------- | ---------------------------------------- |
| POST   | `/register`            | Public   | Register a new user account              |
| POST   | `/login`               | Public   | Login user and return JWT tokens         |
| POST   | `/logout`              | Required | Logout user and invalidate refresh token |
| POST   | `/refresh-token`       | Public   | Refresh access token using refresh token |
| POST   | `/forgot-password`     | Public   | Request password reset OTP via email     |
| POST   | `/verify-reset-otp`    | Public   | Verify OTP for password reset            |
| POST   | `/reset-password`      | Public   | Reset password using verified OTP        |
| POST   | `/verify-email`        | Public   | Verify email address with OTP            |
| POST   | `/resend-verification` | Public   | Resend email verification OTP            |
| GET    | `/me`                  | Required | Get current authenticated user profile   |

---

## User APIs (`/api/users`)

| Method | Endpoint                    | Auth     | Role | Description                     |
| ------ | --------------------------- | -------- | ---- | ------------------------------- |
| GET    | `/profile`                  | Required | User | Get user profile information    |
| PUT    | `/profile`                  | Required | User | Update user profile details     |
| PUT    | `/preferences`              | Required | User | Update user preferences         |
| PUT    | `/notification-preferences` | Required | User | Update notification preferences |
| GET    | `/addresses`                | Required | User | Get all saved addresses         |
| POST   | `/addresses`                | Required | User | Add a new delivery address      |
| PUT    | `/addresses/:addressId`     | Required | User | Update specific address         |
| DELETE | `/addresses/:addressId`     | Required | User | Delete specific address         |
| GET    | `/orders`                   | Required | User | Get user's order history        |
| GET    | `/orders/:orderId`          | Required | User | Get specific order details      |
| POST   | `/avatar`                   | Required | User | Upload/update user avatar       |

---

## Restaurant APIs (`/api/restaurants`)

| Method | Endpoint                             | Auth     | Role       | Description                        |
| ------ | ------------------------------------ | -------- | ---------- | ---------------------------------- |
| GET    | `/`                                  | Public   | -          | Get all restaurants (with filters) |
| GET    | `/:id`                               | Public   | -          | Get restaurant by ID               |
| GET    | `/:id/menu`                          | Public   | -          | Get restaurant menu                |
| GET    | `/restaurant`                        | Required | Restaurant | Get own restaurant profile         |
| POST   | `/`                                  | Required | Restaurant | Create new restaurant              |
| PUT    | `/restaurant`                        | Required | Restaurant | Update own restaurant              |
| GET    | `/restaurant/orders`                 | Required | Restaurant | Get restaurant's orders            |
| PUT    | `/restaurant/orders/:orderId/status` | Required | Restaurant | Update order status                |
| GET    | `/restaurant/analytics`              | Required | Restaurant | Get restaurant analytics           |
| POST   | `/restaurant/images`                 | Required | Restaurant | Upload restaurant images           |

---

## Food APIs (`/api/food`)

| Method | Endpoint                    | Auth     | Role       | Description                                   |
| ------ | --------------------------- | -------- | ---------- | --------------------------------------------- |
| GET    | `/`                         | Optional | -          | Get all food items (with filters, pagination) |
| GET    | `/categories`               | Public   | -          | Get all food categories                       |
| GET    | `/search`                   | Public   | -          | Search food items                             |
| GET    | `/:id`                      | Public   | -          | Get food item by ID                           |
| GET    | `/restaurant/:restaurantId` | Public   | -          | Get food items for specific restaurant        |
| POST   | `/`                         | Required | Restaurant | Create new food item                          |
| PUT    | `/:id`                      | Required | Restaurant | Update food item                              |
| DELETE | `/:id`                      | Required | Restaurant | Delete food item                              |
| PATCH  | `/:id/availability`         | Required | Restaurant | Toggle food item availability                 |
| POST   | `/:id/images`               | Required | Restaurant | Upload food item images                       |

---

## Cart APIs (`/api/cart`)

| Method | Endpoint          | Auth     | Role | Description                  |
| ------ | ----------------- | -------- | ---- | ---------------------------- |
| GET    | `/`               | Required | User | Get user's cart              |
| POST   | `/add`            | Required | User | Add item to cart             |
| PUT    | `/update/:itemId` | Required | User | Update cart item quantity    |
| DELETE | `/remove/:itemId` | Required | User | Remove item from cart        |
| DELETE | `/clear`          | Required | User | Clear entire cart            |
| POST   | `/apply-offer`    | Required | User | Apply offer/discount to cart |

---

## Order APIs (`/api/orders`)

| Method | Endpoint                     | Auth     | Role       | Description                     |
| ------ | ---------------------------- | -------- | ---------- | ------------------------------- |
| POST   | `/`                          | Required | User       | Create new order                |
| GET    | `/`                          | Required | User       | Get user's orders               |
| GET    | `/:orderId`                  | Required | -          | Get order by ID                 |
| PUT    | `/:orderId/cancel`           | Required | User       | Cancel order                    |
| POST   | `/:orderId/rate`             | Required | User       | Rate completed order            |
| GET    | `/restaurant/orders`         | Required | Restaurant | Get restaurant's orders         |
| PUT    | `/:orderId/status`           | Required | Restaurant | Update order status             |
| GET    | `/rider/available`           | Required | Rider      | Get available orders for pickup |
| GET    | `/rider/my-orders`           | Required | Rider      | Get rider's assigned orders     |
| POST   | `/:orderId/accept`           | Required | Rider      | Accept delivery order           |
| PUT    | `/:orderId/location`         | Required | Rider      | Update delivery location        |
| POST   | `/:orderId/confirm-pickup`   | Required | Rider      | Confirm order pickup            |
| POST   | `/:orderId/confirm-delivery` | Required | Rider      | Confirm order delivery          |

---

## Payment APIs (`/api/payments`)

| Method | Endpoint             | Auth     | Role             | Description                    |
| ------ | -------------------- | -------- | ---------------- | ------------------------------ |
| POST   | `/create-intent`     | Required | User             | Create payment intent (Stripe) |
| POST   | `/confirm`           | Required | User             | Confirm payment                |
| GET    | `/methods`           | Required | User             | Get saved payment methods      |
| POST   | `/methods`           | Required | User             | Add new payment method         |
| DELETE | `/methods/:methodId` | Required | User             | Remove payment method          |
| GET    | `/history`           | Required | User             | Get payment history            |
| POST   | `/refund`            | Required | Admin/Restaurant | Process refund                 |

---

## Offer APIs (`/api/offers`)

| Method | Endpoint     | Auth     | Role  | Description                         |
| ------ | ------------ | -------- | ----- | ----------------------------------- |
| GET    | `/`          | Optional | -     | Get active offers                   |
| GET    | `/:id`       | Public   | -     | Get offer by ID                     |
| POST   | `/validate`  | Required | User  | Validate offer code                 |
| GET    | `/admin/all` | Required | Admin | Get all offers (including inactive) |
| POST   | `/`          | Required | Admin | Create new offer                    |
| PUT    | `/:id`       | Required | Admin | Update offer                        |
| DELETE | `/:id`       | Required | Admin | Delete offer                        |

---

## Notification APIs (`/api/notifications`)

| Method | Endpoint        | Auth     | Role | Description                     |
| ------ | --------------- | -------- | ---- | ------------------------------- |
| GET    | `/`             | Required | -    | Get user notifications          |
| GET    | `/unread-count` | Required | -    | Get unread notification count   |
| PUT    | `/:id/read`     | Required | -    | Mark notification as read       |
| PUT    | `/read-all`     | Required | -    | Mark all notifications as read  |
| DELETE | `/:id`          | Required | -    | Delete notification             |
| PUT    | `/preferences`  | Required | -    | Update notification preferences |

---

## Rider APIs (`/api/riders`)

| Method | Endpoint                            | Auth     | Role  | Description                   |
| ------ | ----------------------------------- | -------- | ----- | ----------------------------- |
| POST   | `/register`                         | Public   | -     | Register as a rider           |
| GET    | `/profile`                          | Required | Rider | Get rider profile             |
| PUT    | `/profile`                          | Required | Rider | Update rider profile          |
| POST   | `/documents`                        | Required | Rider | Upload rider documents        |
| PUT    | `/availability`                     | Required | Rider | Update availability status    |
| PUT    | `/location`                         | Required | Rider | Update current location       |
| GET    | `/orders/available`                 | Required | Rider | Get available delivery orders |
| POST   | `/orders/:orderId/accept`           | Required | Rider | Accept delivery order         |
| POST   | `/orders/:orderId/reject`           | Required | Rider | Reject delivery order         |
| GET    | `/orders/current`                   | Required | Rider | Get current active delivery   |
| GET    | `/orders/history`                   | Required | Rider | Get delivery history          |
| POST   | `/orders/:orderId/confirm-pickup`   | Required | Rider | Confirm order pickup          |
| POST   | `/orders/:orderId/confirm-delivery` | Required | Rider | Confirm order delivery        |
| GET    | `/earnings`                         | Required | Rider | Get earnings (all time)       |
| GET    | `/earnings/:period`                 | Required | Rider | Get earnings for period       |
| GET    | `/stats`                            | Required | Rider | Get rider statistics          |
| GET    | `/ratings`                          | Required | Rider | Get rider ratings             |

---

## Admin APIs (`/api/admin`)

| Method | Endpoint                  | Auth     | Role  | Description              |
| ------ | ------------------------- | -------- | ----- | ------------------------ |
| GET    | `/users`                  | Required | Admin | Get all users            |
| GET    | `/users/:id`              | Required | Admin | Get user by ID           |
| PUT    | `/users/:id/status`       | Required | Admin | Update user status       |
| DELETE | `/users/:id`              | Required | Admin | Delete user              |
| GET    | `/restaurants`            | Required | Admin | Get all restaurants      |
| GET    | `/restaurants/:id`        | Required | Admin | Get restaurant by ID     |
| PUT    | `/restaurants/:id/verify` | Required | Admin | Verify restaurant        |
| PUT    | `/restaurants/:id/status` | Required | Admin | Update restaurant status |
| GET    | `/riders`                 | Required | Admin | Get all riders           |
| GET    | `/riders/:id`             | Required | Admin | Get rider by ID          |
| PUT    | `/riders/:id/verify`      | Required | Admin | Verify rider             |
| PUT    | `/riders/:id/status`      | Required | Admin | Update rider status      |
| GET    | `/orders`                 | Required | Admin | Get all orders           |
| GET    | `/orders/:id`             | Required | Admin | Get order by ID          |
| PUT    | `/orders/:id`             | Required | Admin | Update order             |
| POST   | `/categories`             | Required | Admin | Create category          |
| PUT    | `/categories/:id`         | Required | Admin | Update category          |
| DELETE | `/categories/:id`         | Required | Admin | Delete category          |
| GET    | `/analytics/platform`     | Required | Admin | Get platform analytics   |
| GET    | `/analytics/sales`        | Required | Admin | Get sales analytics      |
| GET    | `/analytics/users`        | Required | Admin | Get user analytics       |
| GET    | `/settings`               | Required | Admin | Get system settings      |
| PUT    | `/settings`               | Required | Admin | Update system settings   |

---

## Health Check

| Method | Endpoint  | Auth   | Description           |
| ------ | --------- | ------ | --------------------- |
| GET    | `/health` | Public | Health check endpoint |

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

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

---

## Success Response Format

```json
{
  "success": true,
  "message": "Success description",
  "data": {} // Response data
}
```
