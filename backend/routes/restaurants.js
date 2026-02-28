import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateRestaurant } from '../middleware/validation.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';
import {
  getAllRestaurants,
  getRestaurantById,
  getMyRestaurant,
  createRestaurant,
  updateRestaurant,
  getRestaurantOrders,
  updateOrderStatus,
  getRestaurantAnalytics,
  getRestaurantMenu,
  uploadRestaurantImages
} from '../controllers/restaurantController.js';

const router = express.Router();

// Public routes
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getRestaurantMenu);

// Restaurant owner routes
router.use(authenticate);
router.use(authorize('restaurant', 'admin'));

router.get('/my/restaurant', getMyRestaurant);
router.post('/', validate(validateRestaurant), createRestaurant);
router.put('/restaurant', validate(validateRestaurant), updateRestaurant);
router.get('/restaurant/orders', getRestaurantOrders);
router.put('/restaurant/orders/:orderId/status', updateOrderStatus);
router.get('/restaurant/analytics', getRestaurantAnalytics);
router.post('/restaurant/images', uploadMultiple('images', 5), handleUploadError, uploadRestaurantImages);

export default router;