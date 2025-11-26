import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateOrder } from '../middleware/validation.js';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  rateOrder,
  getRestaurantOrders,
  updateOrderStatus,
  getAvailableOrders,
  acceptOrder,
  updateDeliveryLocation,
  confirmPickup,
  confirmDelivery,
  getRiderOrders
} from '../controllers/orderController.js';

const router = express.Router();

// User order routes
router.post('/', authenticate, authorize('user'), validate(validateOrder), createOrder);
router.get('/', authenticate, authorize('user'), getUserOrders);
router.get('/:orderId', authenticate, getOrderById);
router.put('/:orderId/cancel', authenticate, authorize('user'), cancelOrder);
router.post('/:orderId/rate', authenticate, authorize('user'), rateOrder);

// Restaurant order routes
router.get('/restaurant/orders', authenticate, authorize('restaurant'), getRestaurantOrders);
router.put('/:orderId/status', authenticate, authorize('restaurant'), updateOrderStatus);

// Rider order routes
router.get('/rider/available', authenticate, authorize('rider'), getAvailableOrders);
router.get('/rider/my-orders', authenticate, authorize('rider'), getRiderOrders);
router.post('/:orderId/accept', authenticate, authorize('rider'), acceptOrder);
router.put('/:orderId/location', authenticate, authorize('rider'), updateDeliveryLocation);
router.post('/:orderId/confirm-pickup', authenticate, authorize('rider'), confirmPickup);
router.post('/:orderId/confirm-delivery', authenticate, authorize('rider'), confirmDelivery);

export default router;