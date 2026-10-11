import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import Offer from "../models/Offer.js";
import FoodItem from "../models/FoodItem.js";
import Settings from "../models/Settings.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    },
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true },
  ).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    data: {
      user,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});

// @desc    Get all restaurants
// @route   GET /api/admin/restaurants
// @access  Private (Admin)
export const getAllRestaurants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, verified, search } = req.query;

  const query = {};
  if (verified !== undefined) query.isVerified = verified === "true";
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const restaurants = await Restaurant.find(query)
    .populate("ownerId", "profile firstName lastName email")
    .sort({ createdAt: -1 })
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
        total,
      },
    },
  });
});

// @desc    Get restaurant by ID
// @route   GET /api/admin/restaurants/:id
// @access  Private (Admin)
export const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate(
    "ownerId",
    "profile firstName lastName email phone",
  );

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  res.json({
    success: true,
    data: {
      restaurant,
    },
  });
});

// @desc    Verify restaurant
// @route   PUT /api/admin/restaurants/:id/verify
// @access  Private (Admin)
export const verifyRestaurant = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { isVerified },
    { new: true },
  );

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  res.json({
    success: true,
    message: `Restaurant ${isVerified ? "verified" : "unverified"} successfully`,
    data: {
      restaurant,
    },
  });
});

// @desc    Update restaurant status
// @route   PUT /api/admin/restaurants/:id/status
// @access  Private (Admin)
export const updateRestaurantStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true },
  );

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  res.json({
    success: true,
    message: `Restaurant ${isActive ? "activated" : "deactivated"} successfully`,
    data: {
      restaurant,
    },
  });
});

// @desc    Get all riders
// @route   GET /api/admin/riders
// @access  Private (Admin)
export const getAllRiders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, verified, search } = req.query;

  const query = { role: "rider" };
  if (verified !== undefined)
    query["riderProfile.isVerified"] = verified === "true";
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
    ];
  }

  const riders = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      riders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    },
  });
});

// @desc    Get rider by ID
// @route   GET /api/admin/riders/:id
// @access  Private (Admin)
export const getRiderById = asyncHandler(async (req, res) => {
  const rider = await User.findOne({
    _id: req.params.id,
    role: "rider",
  }).select("-password");

  if (!rider) {
    return res.status(404).json({
      success: false,
      message: "Rider not found",
    });
  }

  res.json({
    success: true,
    data: {
      rider,
    },
  });
});

// @desc    Verify rider
// @route   PUT /api/admin/riders/:id/verify
// @access  Private (Admin)
export const verifyRider = asyncHandler(async (req, res) => {
  const { isVerified, verificationNotes } = req.body;

  const rider = await User.findOneAndUpdate(
    { _id: req.params.id, role: "rider" },
    {
      "riderProfile.isVerified": isVerified,
      "riderProfile.verificationStatus": isVerified ? "approved" : "rejected",
      "riderProfile.verificationNotes": verificationNotes,
    },
    { new: true },
  ).select("-password");

  if (!rider) {
    return res.status(404).json({
      success: false,
      message: "Rider not found",
    });
  }

  res.json({
    success: true,
    message: `Rider ${isVerified ? "verified" : "rejected"} successfully`,
    data: {
      rider,
    },
  });
});

// @desc    Update rider status
// @route   PUT /api/admin/riders/:id/status
// @access  Private (Admin)
export const updateRiderStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const rider = await User.findOneAndUpdate(
    { _id: req.params.id, role: "rider" },
    { isActive },
    { new: true },
  ).select("-password");

  if (!rider) {
    return res.status(404).json({
      success: false,
      message: "Rider not found",
    });
  }

  res.json({
    success: true,
    message: `Rider ${isActive ? "activated" : "deactivated"} successfully`,
    data: {
      rider,
    },
  });
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

  const query = {};
  if (status) query.status = status;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const orders = await Order.find(query)
    .populate("userId", "profile firstName lastName email")
    .populate("restaurantId", "name")
    .populate("riderId", "profile firstName lastName")
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
        total,
      },
    },
  });
});

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("userId", "profile firstName lastName email phone")
    .populate("restaurantId", "name contact")
    .populate("riderId", "profile firstName lastName phone")
    .populate("items.foodItemId", "name price");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.json({
    success: true,
    data: {
      order,
    },
  });
});

// @desc    Update order
// @route   PUT /api/admin/orders/:id
// @access  Private (Admin)
export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.json({
    success: true,
    message: "Order updated successfully",
    data: {
      order,
    },
  });
});

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (Admin)
export const getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive, search } = req.query;

  const query = {};
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const categories = await Category.find(query)
    .sort({ name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Category.countDocuments(query);

  res.json({
    success: true,
    data: {
      categories,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    },
  });
});

// @desc    Get category by ID
// @route   GET /api/admin/categories/:id
// @access  Private (Admin)
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  res.json({
    success: true,
    data: {
      category,
    },
  });
});

// @desc    Get all admin users
// @route   GET /api/admin/admins
// @access  Private (Admin)
export const getAllAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = { role: "admin" };
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
    ];
  }

  const admins = await User.find(query)
    .select("email role profile isActive isVerified createdAt lastLogin")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      admins,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    },
  });
});

// @desc    Get admin by ID
// @route   GET /api/admin/admins/:id
// @access  Private (Admin)
export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await User.findOne({
    _id: req.params.id,
    role: "admin",
  }).select("email role profile isActive isVerified createdAt lastLogin");

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  res.json({
    success: true,
    data: {
      admin,
    },
  });
});

// @desc    Create admin
// @route   POST /api/admin/admins
// @access  Private (Admin)
export const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: "email, password, firstName and lastName are required",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email",
    });
  }

  // Pre-save hook hashes the password
  const admin = await User.create({
    email,
    password,
    role: "admin",
    isActive: true,
    isVerified: true,
    profile: { firstName, lastName },
  });

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    data: {
      admin,
    },
  });
});

// @desc    Update admin
// @route   PUT /api/admin/admins/:id
// @access  Private (Admin)
export const updateAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, isActive } = req.body;

  const admin = await User.findOne({ _id: req.params.id, role: "admin" });
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  if (firstName !== undefined) admin.profile.firstName = firstName;
  if (lastName !== undefined) admin.profile.lastName = lastName;
  if (email !== undefined && email !== admin.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    admin.email = email;
  }
  if (isActive !== undefined) admin.isActive = isActive;

  await admin.save();

  res.json({
    success: true,
    message: "Admin updated successfully",
    data: {
      admin,
    },
  });
});

// @desc    Delete admin
// @route   DELETE /api/admin/admins/:id
// @access  Private (Admin)
export const deleteAdmin = asyncHandler(async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  const admin = await User.findOneAndDelete({
    _id: req.params.id,
    role: "admin",
  });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  res.json({
    success: true,
    message: "Admin deleted successfully",
  });
});

// @desc    Get all food items across all restaurants
// @route   GET /api/admin/food
// @access  Private (Admin)
export const getAllFoodItems = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    restaurantId,
    isAvailable,
  } = req.query;

  const query = {};
  if (restaurantId) query.restaurantId = restaurantId;
  if (category) query.categoryId = category;
  if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const foodItems = await FoodItem.find(query)
    .populate("restaurantId", "name cuisineType isOpen isActive")
    .populate("categoryId", "name")
    .sort({ createdAt: -1 })
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
        total,
      },
    },
  });
});

// @desc    Get all offers
// @route   GET /api/admin/offers
// @access  Private (Admin)
export const getAllOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive, search } = req.query;

  const query = {};
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const offers = await Offer.find(query)
    .populate("applicableCategories", "name")
    .populate("applicableRestaurants", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Offer.countDocuments(query);

  res.json({
    success: true,
    data: {
      offers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    },
  });
});

// @desc    Get all payments across all users
// @route   GET /api/admin/payments
// @access  Private (Admin)
export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    paymentStatus,
    paymentMethod,
    startDate,
    endDate,
  } = req.query;

  const query = {};
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const payments = await Order.find(query)
    .select(
      "orderId userId restaurantId grandTotal paymentStatus paymentMethod createdAt",
    )
    .populate("userId", "profile email")
    .populate("restaurantId", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  // Aggregate totals for the filtered set
  const totals = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
        paidOrders: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
        },
        refundedOrders: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "refunded"] }, 1, 0] },
        },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      payments,
      summary: totals[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        paidOrders: 0,
        refundedOrders: 0,
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    },
  });
});

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private (Admin)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  const category = await Category.create({
    name,
    description,
    image,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: {
      category,
    },
  });
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  res.json({
    success: true,
    message: "Category updated successfully",
    data: {
      category,
    },
  });
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics/platform
// @access  Private (Admin)
export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // User analytics
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });
  const userRoles = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  // Restaurant analytics
  const totalRestaurants = await Restaurant.countDocuments();
  const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
  const verifiedRestaurants = await Restaurant.countDocuments({
    isVerified: true,
  });

  // Order analytics
  const totalOrders = await Order.countDocuments();
  const recentOrders = await Order.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });
  const orderStatus = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Revenue analytics
  const revenueData = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$grandTotal" },
        recentRevenue: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, "$grandTotal", 0],
          },
        },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      analytics: {
        users: {
          total: totalUsers,
          new: newUsers,
          byRole: userRoles,
        },
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants,
          verified: verifiedRestaurants,
        },
        orders: {
          total: totalOrders,
          recent: recentOrders,
          byStatus: orderStatus,
        },
        revenue: revenueData[0] || { totalRevenue: 0, recentRevenue: 0 },
      },
    },
  });
});

// @desc    Get sales analytics
// @route   GET /api/admin/analytics/sales
// @access  Private (Admin)
export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;

  let startDate = new Date();
  if (period === "week") startDate.setDate(startDate.getDate() - 7);
  else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
  else if (period === "year")
    startDate.setFullYear(startDate.getFullYear() - 1);

  // Sales over time
  const salesOverTime = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        dailySales: { $sum: "$grandTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top restaurants by sales
  const topRestaurants = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$restaurantId",
        totalSales: { $sum: "$grandTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "restaurants",
        localField: "_id",
        foreignField: "_id",
        as: "restaurant",
      },
    },
    { $unwind: "$restaurant" },
  ]);

  // Popular food items
  const popularItems = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
        createdAt: { $gte: startDate },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.foodItemId",
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.price"] },
        },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "fooditems",
        localField: "_id",
        foreignField: "_id",
        as: "foodItem",
      },
    },
    { $unwind: "$foodItem" },
  ]);

  res.json({
    success: true,
    data: {
      salesOverTime,
      topRestaurants,
      popularItems,
    },
  });
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private (Admin)
export const getUserAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // User growth
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        newUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // User activity
  const activeUsers = await Order.distinct("userId", {
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Average order value by user role
  const avgOrderValue = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $group: {
        _id: "$user.role",
        avgOrderValue: { $avg: "$grandTotal" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      userGrowth,
      activeUsers: activeUsers.length,
      avgOrderValue,
    },
  });
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getSystemSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: "system" });
  if (!settings) settings = await Settings.create({ key: "system" });

  res.json({
    success: true,
    data: {
      settings,
    },
  });
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateSystemSettings = asyncHandler(async (req, res) => {
  // Accept both { settings: {...} } and a flat body
  const payload = req.body?.settings ?? req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({
      success: false,
      message: "Settings payload is required",
    });
  }

  const allowedSections = [
    "platform",
    "delivery",
    "payments",
    "notifications",
  ];
  const updates = {};
  for (const section of allowedSections) {
    if (payload[section] && typeof payload[section] === "object") {
      updates[section] = payload[section];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: `No valid settings sections provided. Expected one of: ${allowedSections.join(", ")}`,
    });
  }

  // Upsert so the first update works even if the doc was never created
  const settings = await Settings.findOneAndUpdate(
    { key: "system" },
    { $set: updates },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({
    success: true,
    message: "Settings updated successfully",
    data: {
      settings,
    },
  });
});
