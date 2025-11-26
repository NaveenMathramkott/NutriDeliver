import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import {
  // User management
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  
  // Restaurant management
  getAllRestaurants,
  getRestaurantById,
  verifyRestaurant,
  updateRestaurantStatus,
  
  // Order management
  getAllOrders,
  getOrderById,
  updateOrder,
  
  // Analytics
  getPlatformAnalytics,
  getSalesAnalytics,
  getUserAnalytics,
  
  // Category management
  createCategory,
  updateCategory,
  deleteCategory,
  
  
  // Rider management
  getAllRiders,
  getRiderById,
  verifyRider,
  updateRiderStatus,
  
  // System settings
  updateSystemSettings,
  getSystemSettings
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Restaurant management
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurantById);
router.put('/restaurants/:id/verify', verifyRestaurant);

router.put('/restaurants/:id/status', updateRestaurantStatus);

// Rider management
router.get('/riders', getAllRiders);
router.get('/riders/:id', getRiderById);
router.put('/riders/:id/verify', verifyRider);
router.put('/riders/:id/status', updateRiderStatus);

// Order management
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id', updateOrder);

// Category management
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Analytics
router.get('/analytics/platform', getPlatformAnalytics);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/users', getUserAnalytics);

// System settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router;