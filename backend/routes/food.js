import express from 'express';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { validate, validateFoodItem } from '../middleware/validation.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';
import {
  getAllFoodItems,
  getFoodCategories,
  getFoodItemById,
  getRestaurantFoodItems,
  searchFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  toggleFoodAvailability,
  uploadFoodImages
} from '../controllers/foodController.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllFoodItems);
router.get('/categories', getFoodCategories);
router.get('/search', searchFoodItems);
router.get('/:id', getFoodItemById);
router.get('/restaurant/:restaurantId', getRestaurantFoodItems);

// Protected routes - Restaurant owners only
router.use(authenticate);
router.use(authorize('restaurant', 'admin'));

router.post('/', validate(validateFoodItem), createFoodItem);
router.put('/:id', validate(validateFoodItem), updateFoodItem);
router.delete('/:id', deleteFoodItem);
router.patch('/:id/availability', toggleFoodAvailability);
router.post('/:id/images', uploadMultiple('images', 3), handleUploadError, uploadFoodImages);

export default router;