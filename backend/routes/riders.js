import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateRiderRegistration, validateRiderLocation } from '../middleware/validation.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import {
  registerRider,
  getRiderProfile,
  updateRiderProfile,
  updateAvailability,
  updateLocation,
  getAvailableOrders,
  acceptOrder,
  rejectOrder,
  getCurrentDelivery,
  getDeliveryHistory,
  getRiderEarnings,
  getRiderStats,
  getRiderRatings,
  uploadRiderDocuments,
  confirmPickup,
  confirmDelivery
} from '../controllers/riderController.js';

const router = express.Router();

/**
 * @swagger
 * /riders/register:
 *   post:
 *     summary: Register as a rider
 *     tags: [Riders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - profile
 *               - riderProfile
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               profile:
 *                 type: object
 *                 required:
 *                   - firstName
 *                   - lastName
 *                   - phone
 *                   - dateOfBirth
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *               riderProfile:
 *                 type: object
 *                 required:
 *                   - vehicleType
 *                   - vehicleNumber
 *                   - licenseNumber
 *                 properties:
 *                   vehicleType:
 *                     type: string
 *                     enum: [bicycle, motorcycle, car, scooter]
 *                   vehicleNumber:
 *                     type: string
 *                   licenseNumber:
 *                     type: string
 *     responses:
 *       201:
 *         description: Rider registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(validateRiderRegistration), registerRider);

// Protected rider routes
router.use(authenticate);
router.use(authorize('rider'));

/**
 * @swagger
 * /riders/profile:
 *   get:
 *     summary: Get rider profile
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/profile', getRiderProfile);

/**
 * @swagger
 * /riders/profile:
 *   put:
 *     summary: Update rider profile
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *               riderProfile:
 *                 type: object
 *                 properties:
 *                   vehicleType:
 *                     type: string
 *                     enum: [bicycle, motorcycle, car, scooter]
 *                   vehicleNumber:
 *                     type: string
 *                   licenseNumber:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/profile', updateRiderProfile);

/**
 * @swagger
 * /riders/documents:
 *   post:
 *     summary: Upload rider documents
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/documents', uploadSingle('document'), handleUploadError, uploadRiderDocuments);

/**
 * @swagger
 * /riders/availability:
 *   put:
 *     summary: Update availability status
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [available, busy, offline]
 *     responses:
 *       200:
 *         description: Availability updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/availability', updateAvailability);

/**
 * @swagger
 * /riders/location:
 *   put:
 *     summary: Update current location
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
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
 *                 minimum: -90
 *                 maximum: 90
 *               lng:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       200:
 *         description: Location updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/location', validate(validateRiderLocation), updateLocation);

/**
 * @swagger
 * /riders/orders/available:
 *   get:
 *     summary: Get available delivery orders
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Available orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/orders/available', getAvailableOrders);

/**
 * @swagger
 * /riders/orders/{orderId}/accept:
 *   post:
 *     summary: Accept delivery order
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Order not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/orders/:orderId/accept', acceptOrder);

/**
 * @swagger
 * /riders/orders/{orderId}/reject:
 *   post:
 *     summary: Reject delivery order
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/orders/:orderId/reject', rejectOrder);

/**
 * @swagger
 * /riders/orders/current:
 *   get:
 *     summary: Get current active delivery
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current delivery
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/orders/current', getCurrentDelivery);

/**
 * @swagger
 * /riders/orders/history:
 *   get:
 *     summary: Get delivery history
 *     tags: [Riders]
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
 *     responses:
 *       200:
 *         description: Delivery history with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/orders/history', getDeliveryHistory);

/**
 * @swagger
 * /riders/orders/{orderId}/confirm-pickup:
 *   post:
 *     summary: Confirm order pickup
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pickup confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Order not found or not assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/orders/:orderId/confirm-pickup', confirmPickup);

/**
 * @swagger
 * /riders/orders/{orderId}/confirm-delivery:
 *   post:
 *     summary: Confirm order delivery
 *     tags: [Riders]
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
 *             properties:
 *               image:
 *                 type: string
 *               signature:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Order not found or not assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/orders/:orderId/confirm-delivery', confirmDelivery);

/**
 * @swagger
 * /riders/earnings:
 *   get:
 *     summary: Get rider earnings (all time)
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/earnings', getRiderEarnings);

/**
 * @swagger
 * /riders/earnings/{period}:
 *   get:
 *     summary: Get earnings for period
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *     responses:
 *       200:
 *         description: Earnings for period
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/earnings/:period', getRiderEarnings);

/**
 * @swagger
 * /riders/stats:
 *   get:
 *     summary: Get rider statistics
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/stats', getRiderStats);

/**
 * @swagger
 * /riders/ratings:
 *   get:
 *     summary: Get rider ratings
 *     tags: [Riders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider ratings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/ratings', getRiderRatings);

export default router;