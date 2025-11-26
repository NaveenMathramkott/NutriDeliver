import FoodItem from '../models/FoodItem.js';
import Category from '../models/Category.js';
import Restaurant from '../models/Restaurant.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all food items
// @route   GET /api/food
// @access  Public
export const getAllFoodItems = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    restaurant,
    minPrice,
    maxPrice,
    maxCalories,
    dietaryTags,
    search,
    sortBy = 'rating',
    sortOrder = 'desc'
  } = req.query;

  const query = { isAvailable: true };
  
  if (category) query.categoryId = category;
  if (restaurant) query.restaurantId = restaurant;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  if (maxCalories) query.calories = { $lte: parseInt(maxCalories) };
  if (dietaryTags) {
    query.dietaryTags = { $in: dietaryTags.split(',') };
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ingredients: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const foodItems = await FoodItem.find(query)
    .populate('restaurantId', 'name rating images')
    .populate('categoryId', 'name')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await FoodItem.countDocuments(query);

  res.json({
    success: true,
    data: {
      foodItems,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get food categories
// @route   GET /api/food/categories
// @access  Public
export const getFoodCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });

  res.json({
    success: true,
    data: {
      categories
    }
  });
});

// @desc    Get food item by ID
// @route   GET /api/food/:id
// @access  Public
export const getFoodItemById = asyncHandler(async (req, res) => {
  const foodItem = await FoodItem.findById(req.params.id)
    .populate('restaurantId', 'name rating images contact operatingHours')
    .populate('categoryId', 'name');

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found'
    });
  }

  res.json({
    success: true,
    data: {
      foodItem
    }
  });
});

// @desc    Get restaurant food items
// @route   GET /api/food/restaurant/:restaurantId
// @access  Public
export const getRestaurantFoodItems = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = { 
    restaurantId: req.params.restaurantId,
    isAvailable: true 
  };
  
  if (category) query.categoryId = category;

  const foodItems = await FoodItem.find(query)
    .populate('categoryId', 'name')
    .sort({ categoryId: 1, name: 1 });

  res.json({
    success: true,
    data: {
      foodItems
    }
  });
});

// @desc    Search food items
// @route   GET /api/food/search
// @access  Public
export const searchFoodItems = asyncHandler(async (req, res) => {
  const { q, category, maxCalories, dietary } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const query = {
    isAvailable: true,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { ingredients: { $in: [new RegExp(q, 'i')] } }
    ]
  };

  if (category) query.categoryId = category;
  if (maxCalories) query.calories = { $lte: parseInt(maxCalories) };
  if (dietary) query.dietaryTags = dietary;

  const foodItems = await FoodItem.find(query)
    .populate('restaurantId', 'name rating images')
    .populate('categoryId', 'name')
    .limit(20);

  res.json({
    success: true,
    data: {
      foodItems,
      count: foodItems.length
    }
  });
});

// @desc    Create food item
// @route   POST /api/food
// @access  Private (Restaurant)
export const createFoodItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const foodItem = await FoodItem.create({
    ...req.body,
    restaurantId: restaurant._id
  });

  res.status(201).json({
    success: true,
    message: 'Food item created successfully',
    data: {
      foodItem
    }
  });
});

// @desc    Update food item
// @route   PUT /api/food/:id
// @access  Private (Restaurant)
export const updateFoodItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const foodItem = await FoodItem.findOneAndUpdate(
    { 
      _id: req.params.id, 
      restaurantId: restaurant._id 
    },
    req.body,
    { new: true, runValidators: true }
  );

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found'
    });
  }

  res.json({
    success: true,
    message: 'Food item updated successfully',
    data: {
      foodItem
    }
  });
});

// @desc    Delete food item
// @route   DELETE /api/food/:id
// @access  Private (Restaurant)
export const deleteFoodItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const foodItem = await FoodItem.findOneAndDelete({
    _id: req.params.id,
    restaurantId: restaurant._id
  });

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found'
    });
  }

  res.json({
    success: true,
    message: 'Food item deleted successfully'
  });
});

// @desc    Toggle food availability
// @route   PATCH /api/food/:id/availability
// @access  Private (Restaurant)
export const toggleFoodAvailability = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const foodItem = await FoodItem.findOne({
    _id: req.params.id,
    restaurantId: restaurant._id
  });

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found'
    });
  }

  foodItem.isAvailable = !foodItem.isAvailable;
  await foodItem.save();

  res.json({
    success: true,
    message: `Food item ${foodItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
    data: {
      foodItem
    }
  });
});

// @desc    Upload food images
// @route   POST /api/food/:id/images
// @access  Private (Restaurant)
export const uploadFoodImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }

  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

  const foodItem = await FoodItem.findOneAndUpdate(
    { 
      _id: req.params.id, 
      restaurantId: restaurant._id 
    },
    { $push: { images: { $each: imagePaths } } },
    { new: true }
  );

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found'
    });
  }

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: {
      images: foodItem.images
       }
  });
});