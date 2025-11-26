import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateUserUpdate } from '../middleware/validation.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import {
  getUserProfile,
  updateUserProfile,
  updatePreferences,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserOrders,
  getUserOrder,
  updateNotificationPreferences
} from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', validate(validateUserUpdate), updateUserProfile);
router.put('/preferences', updatePreferences);
router.put('/notification-preferences', updateNotificationPreferences);

// Address routes
router.get('/addresses', getUserAddresses);
router.post('/addresses', addUserAddress);
router.put('/addresses/:addressId', updateUserAddress);
router.delete('/addresses/:addressId', deleteUserAddress);

// Order routes
router.get('/orders', getUserOrders);
router.get('/orders/:orderId', getUserOrder);

// Avatar upload
router.post('/avatar', uploadSingle('avatar'), handleUploadError, updateUserProfile);

export default router;