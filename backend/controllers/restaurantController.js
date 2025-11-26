import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
export const getAllRestaurants = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    cuisineType,
    minRating,
    search,
    sortBy = 'rating',
    sortOrder = 'desc'
  } = req.query;

  const query = { isActive: true, isVerified: true };
  
  if (cuisineType) query.cuisineType = cuisineType;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const restaurants = await Restaurant.find(query)
    .select('name description cuisineType rating totalReviews images contact operatingHours')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Restaurant.countDocuments(query);

  res.json({
    success: true,
    data: {
      restaurants,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({
    _id: req.params.id,
    isActive: true
  });

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: {
      restaurant
    }
  });
});

// @desc    Get restaurant menu
// @route   GET /api/restaurants/:id/menu
// @access  Public
export const getRestaurantMenu = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = { 
    restaurantId: req.params.id, 
    isAvailable: true 
  };
  
  if (category) query.categoryId = category;

  const menu = await FoodItem.find(query)
    .populate('categoryId', 'name')
    .sort({ categoryId: 1, name: 1 });

  res.json({
    success: true,
    data: {
      menu
    }
  });
});

// @desc    Get my restaurant
// @route   GET /api/restaurants/my/restaurant
// @access  Private (Restaurant)
export const getMyRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: {
      restaurant
    }
  });
});

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant)
export const createRestaurant = asyncHandler(async (req, res) => {
  // Check if user already has a restaurant
  const existingRestaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (existingRestaurant) {
    return res.status(400).json({
      success: false,
      message: 'You already have a restaurant registered'
    });
  }

  const restaurant = await Restaurant.create({
    ...req.body,
    ownerId: req.user.id
  });

  // Update user's restaurant profile
  await User.findByIdAndUpdate(req.user.id, {
    restaurantProfile: {
      restaurantId: restaurant._id,
      roleInRestaurant: 'owner',
      permissions: ['menu_management', 'order_management', 'finance', 'settings']
    }
  });

  res.status(201).json({
    success: true,
    message: 'Restaurant created successfully',
    data: {
      restaurant
    }
  });
});

// @desc    Update restaurant
// @route   PUT /api/restaurants/my/restaurant
// @access  Private (Restaurant)
export const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { ownerId: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    message: 'Restaurant updated successfully',
    data: {
      restaurant
    }
  });
});

// @desc    Get restaurant orders
// @route   GET /api/restaurants/my/restaurant/orders
// @access  Private (Restaurant)
export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const query = { restaurantId: restaurant._id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('userId', 'profile firstName lastName phone')
    .populate('items.foodItemId', 'name price')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Update order status
// @route   PUT /api/restaurants/my/restaurant/orders/:orderId/status
// @access  Private (Restaurant)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const order = await Order.findOneAndUpdate(
    { 
      _id: orderId, 
      restaurantId: restaurant._id 
    },
    { status },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order
    }
  });
});

// @desc    Get restaurant analytics
// @route   GET /api/restaurants/my/restaurant/analytics
// @access  Private (Restaurant)
export const getRestaurantAnalytics = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total orders and revenue
  const totalOrders = await Order.countDocuments({ restaurantId: restaurant._id });
  const totalRevenue = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$grandTotal' }
      }
    }
  ]);

  // Recent orders (last 30 days)
  const recentOrders = await Order.countDocuments({
    restaurantId: restaurant._id,
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Popular items
  const popularItems = await Order.aggregate([
    {
      $match: { restaurantId: restaurant._id }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.foodItemId',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'fooditems',
        localField: '_id',
        foreignField: '_id',
        as: 'foodItem'
      }
    },
    { $unwind: '$foodItem' }
  ]);

  res.json({
    success: true,
    data: {
      analytics: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        popularItems
      }
    }
  });
});

// @desc    Upload restaurant images
// @route   POST /api/restaurants/my/restaurant/images
// @access  Private (Restaurant)
export const uploadRestaurantImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }

  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

  const restaurant = await Restaurant.findOneAndUpdate(
    { ownerId: req.user.id },
    { $push: { images: { $each: imagePaths } } },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: {
      images: restaurant.images
    }
  });
});