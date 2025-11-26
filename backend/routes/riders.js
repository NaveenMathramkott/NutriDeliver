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

// Public routes
router.post('/register', validate(validateRiderRegistration), registerRider);

// Protected rider routes
router.use(authenticate);
router.use(authorize('rider'));

// Profile management
router.get('/profile', getRiderProfile);
router.put('/profile', updateRiderProfile);
router.post('/documents', uploadSingle('document'), handleUploadError, uploadRiderDocuments);

// Availability & location
router.put('/availability', updateAvailability);
router.put('/location', validate(validateRiderLocation), updateLocation);

// Order management
router.get('/orders/available', getAvailableOrders);
router.post('/orders/:orderId/accept', acceptOrder);
router.post('/orders/:orderId/reject', rejectOrder);
router.get('/orders/current', getCurrentDelivery);
router.get('/orders/history', getDeliveryHistory);

// Delivery actions
router.post('/orders/:orderId/confirm-pickup', confirmPickup);
router.post('/orders/:orderId/confirm-delivery', confirmDelivery);

// Earnings & analytics
router.get('/earnings', getRiderEarnings);
router.get('/earnings/:period', getRiderEarnings);
router.get('/stats', getRiderStats);
router.get('/ratings', getRiderRatings);

export default router;