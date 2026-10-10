# Backend Architecture Document: NutriDeliver - Food Delivery App

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [API Endpoints](#api-endpoints)
5. [File Structure](#file-structure)
6. [Security Implementation](#security-implementation)
7. [Scalability Considerations](#scalability-considerations)
8. [Business Logic & Workflows](#business-logic--workflows)

## System Overview

NutriDeliver is a comprehensive healthy food delivery platform with four distinct user roles:
- **Users/Customers**: Browse, order, and track healthy food
- **Restaurants**: Manage menu, orders, and analytics
- **Delivery Riders**: Handle order delivery and tracking
- **Super Admin**: Platform management and analytics

## Technology Stack

### Backend Framework
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payments**: Stripe API (test mode - free)
- **Push Notifications**: Firebase Cloud Messaging (free tier)
- **Environment Variables**: dotenv
- **Validation**: Joi
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston
- **Rate Limiting**: express-rate-limit

## Database Architecture

### Collections/Schemas

#### 1. User Schema
Includes base user information with role-based profiles for customers, restaurants, riders, and admins. Features email/password authentication, profile management, dietary preferences, address storage, and verification status.

#### 2. Restaurant Schema
Contains restaurant details including owner information, contact details, operating hours, location coordinates, ratings, and verification status. Supports multiple cuisine types and bank details for payouts. **New fields**: `isOpen` (boolean), `deliverySettings` (deliveryFee, minOrderAmount, deliveryRadius, estimatedDeliveryTime).

#### 3. Category Schema
Manages food categories with names, descriptions, images, and activation status for organizing healthy food items.

#### 4. Food Item Schema
Stores comprehensive nutritional food information including calories, macronutrients, ingredients, dietary tags, pricing, images, and preparation time. Linked to restaurants and categories.

#### 5. Order Schema
Tracks complete order lifecycle from placement to delivery. Includes order items, pricing breakdown, delivery addresses, status tracking, payment information, and rider assignment details. **Status enum**: `pending` → `confirmed` → `preparing` → `ready_for_pickup` → `pickedup` → `out_for_delivery` → `delivered` / `cancelled`.

#### 6. Cart Schema
Manages user shopping carts with restaurant-specific items, quantities, pricing, and special instructions.

#### 7. Offer/Promotion Schema
Handles discount codes and promotions with validation rules, usage limits, applicability to specific categories/restaurants, and expiration dates.

#### 8. Notification Schema
Stores push and in-app notifications for users with message types, read status, and related data.

#### 9. Enhanced Rider Schema
Extends user schema with rider-specific fields including vehicle information, license details, availability status, real-time location tracking, earnings data, and document management.

#### 10. Earnings Schema
Tracks rider payments including delivery fees, tips, bonuses, payout status, and payment dates.

## API Endpoints

### File Structure
```
backend/
├── config/ (Database, Cloudinary, Firebase configurations)
├── controllers/ (All business logic controllers)
├── middleware/ (Auth, validation, upload, rate limiting)
├── models/ (Mongoose schemas)
├── routes/ (API route definitions)
├── utils/ (Token generation, email, notifications, helpers, backgroundJobs)
├── validations/ (Joi validation schemas)
└── server.js (Application entry point)
```

### Detailed Endpoints

#### Authentication Routes (`/api/auth`)
- **POST /register**: User registration for all roles
- **POST /login**: User authentication
- **POST /logout**: Session termination
- **POST /refresh-token**: JWT token refresh
- **POST /forgot-password**: Password reset request
- **POST /verify-reset-otp**: Verify OTP for password reset
- **POST /reset-password**: Password reset confirmation
- **POST /verify-email**: Email verification
- **POST /resend-verification**: Resend email verification OTP
- **GET /me**: Get current authenticated user profile

#### User Routes (`/api/users`)
- **GET /profile**: Get user profile information
- **PUT /profile**: Update user profile details
- **PUT /preferences**: Update user dietary preferences
- **PUT /notification-preferences**: Update notification preferences
- **GET /addresses**: Get all saved addresses
- **POST /addresses**: Add a new delivery address
- **PUT /addresses/:addressId**: Update specific address
- **DELETE /addresses/:addressId**: Delete specific address
- **GET /orders**: Get user's order history
- **GET /orders/:orderId**: Get specific order details
- **POST /avatar**: Upload/update user avatar

#### Restaurant Routes (`/api/restaurants`)
- **GET /**: Public restaurant listing (with filters)
- **GET /:id**: Get restaurant by ID
- **GET /:id/menu**: Get restaurant menu
- **GET /:id/status**: Get restaurant open status & operating hours
- **POST /:id/check-delivery**: Check delivery availability & fee for address
- **GET /restaurant**: Get own restaurant profile (restaurant owner)
- **POST /**: Create new restaurant (restaurant owner)
- **PUT /restaurant**: Update own restaurant (restaurant owner)
- **PUT /restaurant/toggle-status**: Toggle open/closed status (restaurant owner)
- **GET /restaurant/orders**: Get restaurant's orders (restaurant owner)
- **POST /restaurant/orders/:orderId/respond**: Accept/reject new order (restaurant owner)
- **PUT /restaurant/orders/:orderId/status**: Update order status with validation (restaurant owner)
- **GET /restaurant/analytics**: Get restaurant analytics (restaurant owner)
- **POST /restaurant/images**: Upload restaurant images (restaurant owner)

#### Food Routes (`/api/food`)
- **GET /**: Public food item listing (only open restaurants, with filters, pagination)
- **GET /categories**: Get all food categories
- **GET /search**: Search food items (only open restaurants)
- **GET /:id**: Get food item by ID
- **GET /restaurant/:restaurantId**: Get food items for specific restaurant (validates open status)
- **POST /**: Create new food item (restaurant owner)
- **PUT /:id**: Update food item (restaurant owner)
- **DELETE /:id**: Delete food item (restaurant owner)
- **PATCH /:id/availability**: Toggle food item availability (restaurant owner)
- **POST /:id/images**: Upload food item images (restaurant owner)

#### Cart Routes (`/api/cart`)
- **GET /**: Retrieve cart contents
- **POST /add**: Add items to cart
- **PUT /update/:itemId**: Modify cart item quantity
- **DELETE /remove/:itemId**: Remove item from cart
- **DELETE /clear**: Empty cart
- **POST /apply-offer**: Apply offer/discount to cart

#### Order Routes (`/api/orders`)
- **POST /**: Create new order (user) - validates restaurant open, min order, delivery radius
- **GET /**: Get user's orders (user)
- **GET /:orderId**: Get order by ID (all roles)
- **PUT /:orderId/cancel**: Cancel order (user) - only pending/confirmed
- **POST /:orderId/rate**: Rate completed order (user)
- **GET /restaurant/orders**: Get restaurant's orders (restaurant)
- **PUT /:orderId/status**: Update order status with transition validation (restaurant)
- **POST /restaurant/orders/:orderId/respond**: Accept/reject order (restaurant)
- **GET /rider/available**: Get available delivery orders (rider)
- **GET /rider/my-orders**: Get rider's assigned orders (rider)
- **POST /:orderId/accept**: Accept delivery order (rider)
- **POST /:orderId/reject**: Reject delivery order (rider)
- **PUT /:orderId/location**: Update delivery location (rider)
- **POST /:orderId/confirm-pickup**: Confirm order pickup (rider)
- **POST /:orderId/confirm-delivery**: Confirm order delivery (rider)

#### Payment Routes (`/api/payments`)
- **POST /create-intent**: Create payment intent (Stripe) (user)
- **POST /confirm**: Confirm payment (user)
- **GET /methods**: Get saved payment methods (user)
- **POST /methods**: Add new payment method (user)
- **DELETE /methods/:methodId**: Remove payment method (user)
- **GET /history**: Get payment history (user)
- **POST /refund**: Process refund (admin/restaurant)

#### Offer Routes (`/api/offers`)
- **GET /**: Get active offers (public, optional auth)
- **GET /:id**: Get offer by ID
- **POST /validate**: Validate offer code (user)
- **GET /admin/all**: Get all offers including inactive (admin)
- **POST /**: Create new offer (admin)
- **PUT /:id**: Update offer (admin)
- **DELETE /:id**: Delete offer (admin)

#### Notification Routes (`/api/notifications`)
- **GET /**: Get user notifications
- **GET /unread-count**: Get unread notification count
- **PUT /:id/read**: Mark notification as read
- **PUT /read-all**: Mark all notifications as read
- **DELETE /:id**: Delete notification
- **PUT /preferences**: Update notification preferences

#### Rider Routes (`/api/riders`)
- **POST /register**: Rider-specific registration
- **GET /profile**: Get rider profile
- **PUT /profile**: Update rider profile
- **POST /documents**: Upload rider documents
- **PUT /availability**: Update online/offline status
- **PUT /location**: Update current location
- **GET /orders/available**: Get available delivery orders
- **POST /orders/:orderId/accept**: Accept delivery order
- **POST /orders/:orderId/reject**: Reject delivery order
- **GET /orders/current**: Get current active delivery
- **GET /orders/history**: Get delivery history
- **POST /orders/:orderId/confirm-pickup**: Confirm order pickup
- **POST /orders/:orderId/confirm-delivery**: Confirm order delivery
- **GET /earnings**: Get earnings (all time)
- **GET /earnings/:period**: Get earnings for period
- **GET /stats**: Get rider statistics
- **GET /ratings**: Get rider ratings

#### Admin Routes (`/api/admin`)
- **GET /users**: Get all users
- **GET /users/:id**: Get user by ID
- **PUT /users/:id/status**: Update user status
- **DELETE /users/:id**: Delete user
- **GET /restaurants**: Get all restaurants
- **GET /restaurants/:id**: Get restaurant by ID
- **PUT /restaurants/:id/verify**: Verify restaurant
- **PUT /restaurants/:id/status**: Update restaurant status
- **GET /riders**: Get all riders
- **GET /riders/:id**: Get rider by ID
- **PUT /riders/:id/verify**: Verify rider
- **PUT /riders/:id/status**: Update rider status
- **GET /orders**: Get all orders
- **GET /orders/:id**: Get order by ID
- **PUT /orders/:id**: Update order
- **POST /categories**: Create category
- **PUT /categories/:id**: Update category
- **DELETE /categories/:id**: Delete category
- **GET /analytics/platform**: Get platform analytics
- **GET /analytics/sales**: Get sales analytics
- **GET /analytics/users**: Get user analytics
- **GET /settings**: Get system settings
- **PUT /settings**: Update system settings

#### Health Check
- **GET /health**: Health check endpoint

## Security Implementation

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) for all endpoints
- Password hashing with bcryptjs (12 salt rounds)
- Token expiration: Access token (15 minutes), Refresh token (7 days)

### 2. Data Validation
- Comprehensive input validation using Joi
- MongoDB injection prevention with Mongoose
- XSS protection with helmet and data sanitization

### 3. Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes
- Payment endpoints: 30 requests per 15 minutes
- Dynamic limiting based on user behavior

### 4. Security Headers
- Helmet.js for comprehensive security headers
- CORS configuration for controlled cross-origin requests
- CSRF protection for state-changing operations

## Scalability Considerations

### 1. Database Optimization
- Strategic indexing on frequently queried fields
- Aggregation pipelines for complex analytics
- Connection pooling for efficient database usage

### 2. Caching Strategy
- Redis-ready architecture for session storage
- Query result caching for frequently accessed data
- CDN integration for static asset delivery

### 3. File Upload Optimization
- Cloudinary integration for image management
- Automatic image optimization and transformation
- Scalable cloud storage solutions

### 4. Microservices Architecture
- Modular design for easy service separation
- API gateway pattern implementation
- Service-oriented architecture readiness

### 5. Monitoring & Logging
- Structured logging with Winston
- Comprehensive error tracking and monitoring
- Performance metrics collection and analysis

## Business Logic & Workflows

### Order Lifecycle Flow

```
1. CUSTOMER PLACES ORDER
   ├── Validates: Restaurant open, min order amount, delivery radius
   ├── Creates order with status: "pending"
   ├── Clears customer cart
   └── Notifies restaurant

2. RESTAURANT RESPONDS
   ├── GET /restaurant/orders (sees pending orders)
   ├── POST /restaurant/orders/:orderId/respond { action: "accept" | "reject" }
   │   ├── Accept: status → "confirmed", sets preparationTime & estimatedDelivery
   │   └── Reject: status → "cancelled", adds rejection reason
   └── Notifies customer

3. RESTAURANT PREPARES
   ├── PUT /:orderId/status { status: "preparing" }
   ├── PUT /:orderId/status { status: "ready_for_pickup" }
   └── Notifies nearby riders (via getAvailableOrders)

4. RIDER ACCEPTS
   ├── GET /rider/available (sees ready_for_pickup orders)
   ├── POST /:orderId/accept → status: "pickedup", assigns rider
   └── Updates rider status to "busy"

5. DELIVERY
   ├── PUT /:orderId/location (real-time tracking)
   ├── POST /:orderId/confirm-pickup → status: "out_for_delivery"
   ├── POST /:orderId/confirm-delivery → status: "delivered"
   │   ├── Adds delivery proof (image, signature, notes)
   │   ├── Updates rider earnings & stats
   │   └── Updates rider status to "available"
   └── Notifies customer

6. COMPLETION
   ├── Customer can rate order (POST /:orderId/rate)
   ├── Restaurant rating updated
   └── Order archived
```

### Auto-Cancel Workflow
- **Background job** runs every 5 minutes
- Finds orders with `status: "ready_for_pickup"` and no rider assigned for >10 minutes
- Auto-cancels with reason: "No rider accepted within 10 minutes"
- Notifies customer and restaurant

### Restaurant Open Status
- **Manual toggle**: PUT `/restaurant/toggle-status` (owner controlled)
- **Auto-update**: Background job checks `operatingHours` every 5 minutes
- **Public listings**: Only show open restaurants (`isOpen: true`)
- **Food items**: Only show items from open restaurants

### Delivery Validation
- **Pre-order check**: POST `/restaurants/:id/check-delivery` with lat/lng
- **Order creation**: Validates distance ≤ `deliveryRadius`
- **Fee calculation**: Uses restaurant's `deliverySettings.deliveryFee`
- **Minimum order**: Enforces `deliverySettings.minOrderAmount`

### Status Transition Validation
```javascript
const validTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['pickedup', 'cancelled'],
  pickedup: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};
```

### Background Jobs (server.js)
- **Auto-cancel unassigned orders**: Every 5 minutes (10 min timeout)
- **Update restaurant open status**: Every 5 minutes (based on operatingHours)
- **Cleanup old notifications**: Daily at midnight (30 days, read only)

## Free Libraries & Services