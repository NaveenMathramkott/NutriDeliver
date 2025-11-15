# Backend Architecture Document: NutriDeliver - Food Delivery App

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [API Endpoints](#api-endpoints)
5. [File Structure](#file-structure)
6. [Security Implementation](#security-implementation)
7. [Scalability Considerations](#scalability-considerations)

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
Contains restaurant details including owner information, contact details, operating hours, location coordinates, ratings, and verification status. Supports multiple cuisine types and bank details for payouts.

#### 3. Category Schema
Manages food categories with names, descriptions, images, and activation status for organizing healthy food items.

#### 4. Food Item Schema
Stores comprehensive nutritional food information including calories, macronutrients, ingredients, dietary tags, pricing, images, and preparation time. Linked to restaurants and categories.

#### 5. Order Schema
Tracks complete order lifecycle from placement to delivery. Includes order items, pricing breakdown, delivery addresses, status tracking, payment information, and rider assignment details.

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
├── utils/ (Token generation, email, notifications, helpers)
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
- **POST /reset-password**: Password reset confirmation
- **POST /verify-email**: Email verification

#### User Routes (`/api/users`)
- **GET/PUT /profile**: User profile management
- **PUT /preferences**: Dietary preferences update
- **GET/POST/PUT/DELETE /addresses**: Address management
- **GET /orders**: Order history and details

#### Restaurant Routes (`/api/restaurants`)
- **GET /**: Public restaurant listing
- **GET/PUT /my-restaurant**: Restaurant profile management
- **POST /**: Restaurant registration
- **GET /my-restaurant/orders**: Restaurant order management
- **PUT /orders/:id/status**: Order status updates
- **GET /my-restaurant/analytics**: Sales and performance analytics

#### Food Routes (`/api/food`)
- **GET /**: Public food item listing
- **GET /categories**: Food category listing
- **GET /restaurant/:id**: Restaurant-specific menus
- **POST/PUT/DELETE /**: Food item CRUD operations (Restaurant access)
- **GET /search**: Food search functionality

#### Cart Routes (`/api/cart`)
- **GET /**: Retrieve cart contents
- **POST /add**: Add items to cart
- **PUT /update/:id**: Modify cart items
- **DELETE /remove/:id**: Remove cart items
- **DELETE /clear**: Empty cart

#### Order Routes (`/api/orders`)
- **POST /**: Create new orders
- **GET /**: Order history retrieval
- **GET /:id**: Specific order details
- **PUT /:id/cancel**: Order cancellation
- **POST /:id/rate**: Order rating and reviews
- **GET /rider/available**: Available delivery orders for riders
- **PUT /:id/accept**: Order acceptance by riders
- **PUT /:id/update-location**: Real-time delivery tracking

#### Payment Routes (`/api/payments`)
- **POST /create-intent**: Payment intent creation
- **POST /confirm**: Payment confirmation
- **POST /refund**: Refund processing

#### Offer Routes (`/api/offers`)
- **GET /**: Active offers listing
- **POST /validate**: Offer code validation
- **POST/PUT/DELETE /**: Offer management (Admin access)

#### Notification Routes (`/api/notifications`)
- **GET /**: User notifications
- **PUT /:id/read**: Mark notification as read
- **PUT /read-all**: Mark all notifications as read

#### Rider Routes (`/api/riders`)
- **POST /register**: Rider-specific registration
- **PUT /availability**: Update online/offline status
- **PUT /location**: Real-time location updates
- **GET /orders/available**: Nearby available orders
- **POST /orders/:orderId/accept**: Order acceptance
- **POST /orders/:orderId/reject**: Order rejection
- **POST /orders/:orderId/confirm-pickup**: Restaurant pickup confirmation
- **POST /orders/:orderId/confirm-delivery**: Customer delivery confirmation
- **GET /orders/current**: Active delivery information
- **GET /orders/history**: Delivery history
- **GET /earnings**: Rider income analytics
- **GET /earnings/:period**: Time-based earnings
- **GET /stats**: Performance statistics
- **GET /ratings**: Customer feedback and ratings

#### Admin Routes (`/api/admin`)
- **GET /users**: User management
- **GET /restaurants**: Restaurant management
- **GET /orders**: Platform order oversight
- **GET /analytics**: Business intelligence
- **PUT /restaurants/:id/verify**: Restaurant verification
- **PUT /users/:id/status**: User status management

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
- 100 requests per 15 minutes per IP address
- Enhanced limits for authentication endpoints
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

## Free Libraries & Services


