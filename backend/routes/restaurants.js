import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateRestaurant } from "../middleware/validation.js";
import { uploadMultiple, handleUploadError } from "../middleware/upload.js";
import {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantStatus,
  getMyRestaurant,
  createRestaurant,
  updateRestaurant,
  getRestaurantOrders,
  updateOrderStatus,
  getRestaurantAnalytics,
  getRestaurantMenu,
  uploadRestaurantImages,
  toggleRestaurantStatus,
  respondToOrder,
  checkDelivery
} from "../controllers/restaurantController.js";

const router = express.Router();

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Get all restaurants with filters
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: cuisineType
 *         schema:
 *           type: string
 *           enum: [healthy, salads, protein, vegan, vegetarian, gluten-free, keto, mediterranean, smoothies]
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: rating
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Paginated list of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get("/", getAllRestaurants);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", getRestaurantById);

/**
 * @swagger
 * /restaurants/{id}/menu:
 *   get:
 *     summary: Get restaurant menu
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant menu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Restaurant not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/menu", getRestaurantMenu);

/**
 * @swagger
 * /restaurants/{id}/status:
 *   get:
 *     summary: Get restaurant open status and hours
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/status", getRestaurantStatus);

/**
 * @swagger
 * /restaurants/{id}/check-delivery:
 *   post:
 *     summary: Check delivery availability and fee for address
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Delivery availability and fee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Restaurant not available or closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/check-delivery", checkDelivery);

// Restaurant owner routes
router.use(authenticate);
router.use(authorize("restaurant", "admin"));

/**
 * @swagger
 * /restaurants/restaurant:
 *   get:
 *     summary: Get own restaurant profile
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/restaurant", getMyRestaurant);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create new restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - cuisineType
 *               - contact
 *               - operatingHours
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cuisineType:
 *                 type: string
 *                 enum: [healthy, salads, protein, vegan, vegetarian, gluten-free, keto, mediterranean, smoothies]
 *               contact:
 *                 type: object
 *                 required:
 *                   - email
 *                   - phone
 *                   - address
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: object
 *                     required:
 *                       - street
 *                       - city
 *                       - state
 *                       - zipCode
 *                       - coordinates
 *                     properties:
 *                       street:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       zipCode:
 *                         type: string
 *                       coordinates:
 *                         type: object
 *                         required:
 *                           - lat
 *                           - lng
 *                         properties:
 *                           lat:
 *                             type: number
 *                           lng:
 *                             type: number
 *               operatingHours:
 *                 type: object
 *                 required:
 *                   - opening
 *                   - closing
 *                   - days
 *                 properties:
 *                   opening:
 *                     type: string
 *                   closing:
 *                     type: string
 *                   days:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *     responses:
 *       201:
 *         description: Restaurant created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error or restaurant exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", validate(validateRestaurant), createRestaurant);

/**
 * @swagger
 * /restaurants/restaurant:
 *   put:
 *     summary: Update own restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       200:
 *         description: Restaurant updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put("/restaurant", validate(validateRestaurant), updateRestaurant);

/**
 * @swagger
 * /restaurants/restaurant/orders:
 *   get:
 *     summary: Get restaurant's orders
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant orders with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get("/restaurant/orders", getRestaurantOrders);

/**
 * @swagger
 * /restaurants/restaurant/orders/{orderId}/status:
 *   put:
 *     summary: Update order status (validated transitions)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready_for_pickup, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/restaurant/orders/:orderId/status", updateOrderStatus);

/**
 * @swagger
 * /restaurants/restaurant/analytics:
 *   get:
 *     summary: Get restaurant analytics
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant analytics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get("/restaurant/analytics", getRestaurantAnalytics);

/**
 * @swagger
 * /restaurants/restaurant/images:
 *   post:
 *     summary: Upload restaurant images
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post(
  "/restaurant/images",
  uploadMultiple("images", 5),
  handleUploadError,
  uploadRestaurantImages,
);

/**
 * @swagger
 * /restaurants/restaurant/toggle-status:
 *   put:
 *     summary: Toggle restaurant open/closed status
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put("/restaurant/toggle-status", toggleRestaurantStatus);

/**
 * @swagger
 * /restaurants/restaurant/orders/{orderId}/respond:
 *   post:
 *     summary: Accept or reject new order
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order responded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid action or order not pending
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/restaurant/orders/:orderId/respond", respondToOrder);

export default router;