## ** RESTAURANT APP (Restaurant Owners/Managers)**

Application focusing for the restaurant management and delivery system.

## Get started

1. Install dependencies

   ```bash
   cd frontend/restaurant
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

### **Primary Flow:**

```
Login → Dashboard → Manage Menu → Handle Orders → Update Status → View Analytics
```

### **Required Screens:**

#### **A. Authentication (2 Screens)**

1. **Restaurant Login** - Restaurant-specific credentials
2. **Setup Screen** - Initial restaurant configuration

#### **B. Dashboard & Orders (6 Screens)**

3. **Main Dashboard** - Today's stats, pending orders
4. **Active Orders Screen** - Live orders with status
5. **Order Detail Screen** - Order items, special instructions
6. **Order History Screen** - Past orders with filtering
7. **Order Status Update** - Accept/Ready/Picked up
8. **Preparation Timer** - For each order

#### **C. Menu Management (4 Screens)**

9. **Menu Overview** - All categories and items
10. **Category Management** - Add/edit food categories
11. **Food Item Management** - Add/edit with nutritional data
12. **Inventory Management** - Stock levels, availability toggle

#### **D. Operations & Analytics (5 Screens)**

13. **Analytics Dashboard** - Sales, popular items, peak hours
14. **Earnings Screen** - Daily/weekly/monthly earnings
15. **Restaurant Profile** - Operating hours, description, images
16. **Notification Center** - New orders, system alerts
17. **Support/Help**

### **Restaurant App APIs Required:**

#### **Authentication**

- `POST /api/auth/restaurant/login`
- `GET /api/auth/restaurant/profile`

#### **Orders Management**

- `GET /api/restaurant/orders` (filter by status)
- `GET /api/restaurant/orders/:id`
- `PUT /api/orders/:id/status` (accept → preparing → ready)
- `POST /api/orders/:id/preparation-time`

#### **Menu Management**

- `GET /api/restaurant/menu`
- `POST /api/restaurant/menu/categories`
- `POST /api/restaurant/menu/items`
- `PUT /api/restaurant/menu/items/:id`
- `DELETE /api/restaurant/menu/items/:id`
- `PUT /api/restaurant/menu/availability` (toggle items)

#### **Analytics & Earnings**

- `GET /api/restaurant/analytics/daily`
- `GET /api/restaurant/analytics/weekly`
- `GET /api/restaurant/earnings`
- `GET /api/restaurant/popular-items`

#### **Restaurant Profile**

- `PUT /api/restaurant/profile`
- `POST /api/restaurant/upload-image` (Cloudinary)
- `PUT /api/restaurant/operating-hours`

#### **Notifications**

- `GET /api/restaurant/notifications`
- `WS /restaurant-orders` (WebSocket for real-time orders)

---
