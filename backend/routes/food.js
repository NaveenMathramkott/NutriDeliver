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

/**
 * @swagger
 * /food:
 *   get:
 *     summary: Get all food items (from open restaurants only)
 *     tags: [Food]
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
 *           default: 12
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: restaurant
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxCalories
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dietaryTags
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Paginated list of food items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/', optionalAuth, getAllFoodItems);

/**
 * @swagger
 * /food/categories:
 *   get:
 *     summary: Get all food categories
 *     tags: [Food]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/categories', getFoodCategories);

/**
 * @swagger
 * /food/search:
 *   get:
 *     summary: Search food items (from open restaurants only)
 *     tags: [Food]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxCalories
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dietary
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Search query required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', searchFoodItems);

/**
 * @swagger
 * /food/{id}:
 *   get:
 *     summary: Get food item by ID
 *     tags: [Food]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Food item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getFoodItemById);

/**
 * @swagger
 * /food/restaurant/{restaurantId}:
 *   get:
 *     summary: Get food items for specific restaurant
 *     tags: [Food]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant food items
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
router.get('/restaurant/:restaurantId', getRestaurantFoodItems);

// Protected routes - Restaurant owners only
router.use(authenticate);
router.use(authorize('restaurant', 'admin'));

/**
 * @swagger
 * /food:
 *   post:
 *     summary: Create new food item
 *     tags: [Food]
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
 *               - categoryId
 *               - price
 *               - calories
 *               - protein
 *               - carbs
 *               - fat
 *               - ingredients
 *               - preparationTime
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0
 *               calories:
 *                 type: number
 *               protein:
 *                 type: number
 *               carbs:
 *                 type: number
 *               fat:
 *                 type: number
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               dietaryTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [vegan, vegetarian, gluten-free, dairy-free, nut-free, low-carb, high-protein, keto, paleo, sugar-free, organic, non-gmo]
 *               preparationTime:
 *                 type: integer
 *                 minimum: 1
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Food item created
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
router.post('/', validate(validateFoodItem), createFoodItem);

/**
 * @swagger
 * /food/{id}:
 *   put:
 *     summary: Update food item
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/FoodItem'
 *     responses:
 *       200:
 *         description: Food item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validate(validateFoodItem), updateFoodItem);

/**
 * @swagger
 * /food/{id}:
 *   delete:
 *     summary: Delete food item
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Food item deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteFoodItem);

/**
 * @swagger
 * /food/{id}/availability:
 *   patch:
 *     summary: Toggle food item availability
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/availability', toggleFoodAvailability);

/**
 * @swagger
 * /food/{id}/images:
 *   post:
 *     summary: Upload food item images
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.post('/:id/images', uploadMultiple('images', 3), handleUploadError, uploadFoodImages);

export default router;