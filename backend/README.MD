# **NutriDeliver – Backend Overview**

A robust, scalable, and secure backend powering **NutriDeliver**, a healthy food delivery ecosystem designed for customers, restaurants, riders, and platform administrators.

---

## **📌 Table of Contents**

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Database Structure](#database-structure)
6. [Project File Structure](#project-file-structure)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Free Libraries & Services](#free-libraries--services)

---

## **🔍 Overview**

NutriDeliver is a full backend service enabling:

* Healthy food browsing & ordering
* Restaurant management & analytics
* Real-time rider delivery tracking
* Full administrative oversight

This backend is built with scalability, modularity, and security at its core, ensuring it can grow into a production-level platform.

---

## **✨ Key Features**

### **1. Multi-Role Platform**

* **Customers:** Browse menus, manage carts, place orders, track deliveries
* **Restaurants:** Manage menus, orders, analytics, operational details
* **Riders:** Track deliveries, update status, manage earnings
* **Admins:** Oversight, verification, analytics, system control

---

### **2. Core Functionalities**

* User registration, authentication & role management
* Restaurant onboarding & menu/nutrition management
* Food categorization & healthy dietary tagging
* Smart cart and checkout system
* Order lifecycle: creation → acceptance → pickup → delivery
* Realtime tracking for rider location
* Payments system (Stripe test mode)
* Push notifications & in-app notifications
* Offers, promotions, and discount engines
* Rider earnings, payouts & statistics
* Platform analytics for admin

---

### **3. Operational Capabilities**

* Email services for verification, password resets
* Image storage & optimization (Cloudinary)
* Detailed nutritional metadata for foods
* Rating & feedback mechanisms
* System logging and monitoring
* Secure file uploads
* Role-based access and permissions

---

## **🛠 Tech Stack**

### **Backend**

* Node.js
* Express.js

### **Database**

* MongoDB with Mongoose

### **Authentication**

* JWT (Access + Refresh)
* bcryptjs password hashing

### **Other Libraries**

* Multer (uploads)
* Joi (validation)
* Nodemailer
* Stripe API
* Firebase Cloud Messaging
* Winston logging
* express-rate-limit
* dotenv

---

## **🗄 Database Structure**

The system follows a modular and scalable schema design including:

* **User Schema** – Multi-role foundation (customer/restaurant/rider/admin)
* **Restaurant Schema** – Operational, financial & menu metadata
* **Category Schema** – Food grouping & healthy categorization
* **Food Item Schema** – Nutritional data, ingredients, preparation time, pricing
* **Order Schema** – Complete lifecycle tracking
* **Cart Schema** – Smart restaurant-linked cart system
* **Offer Schema** – Promotions, discount rules, expiry logic
* **Notification Schema** – Push + in-app notifications
* **Rider Schema (Enhanced)** – Vehicle info, docs, availability, tracking
* **Earnings Schema** – Rider pay, bonuses, payout cycles

This modular structure enables future microservices separation.

---

## **📁 Project File Structure**

```
backend/
├── config/             # Database, Firebase, Cloudinary configurations
├── controllers/        # Business logic for modules
├── middleware/         # Auth, validation, rate limiting, uploads
├── models/             # Mongoose schemas
├── routes/             # Route mapping (no logic)
├── utils/              # Helpers, notifications, token services
├── validations/        # Joi validators
└── server.js           # Application entry point
```


---

## **🔐 Security Architecture**

* **JWT authentication** with refresh and access tokens
* **Role-Based Access Control (RBAC)**
* **Password hashing** using bcryptjs
* **Validation** with Joi
* **HTTP security headers** via Helmet
* **CORS control** for secured cross-domain requests
* **Rate limiting** to prevent abuse
* **Sanitization & XSS protection**

---

## **📈 Scalability & Performance**

### **1. Database Optimization**

* Strategic indexing
* Aggregation pipelines
* Efficient connection pooling

### **2. Caching Ready**

* Redis-supported caching architecture
* CDN-compatible image storage

### **3. Cloud-Optimized File Uploads**

* Cloudinary integration
* Automatic optimization & resizing

### **4. Microservices Ready**

* Modular, decoupled folder architecture
* Easy migration to service-based model
* API gateway compatible

### **5. Monitoring & Logging**

* Structured & filterable logs (Winston)
* Error & performance tracking
* Request-level monitoring

---

## <a name="quick-start">Start Project</a>

Follow these steps to set up the project locally on your machine.

**Add the following to the .env file**

server :

```bash
MONGODB_URI =*********
CLIENT_URL =http://localhost:****

NODE_ENV=development
PORT=****
```
