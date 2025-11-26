import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createNotification } from './notificationController.js';

// @desc    Register as rider
// @route   POST /api/riders/register
// @access  Public
export const registerRider = asyncHandler(async (req, res) => {
  const { email, password, profile, riderProfile } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create rider user
  const user = await User.create({
    email,
    password,
    profile,
    role: 'rider',
    riderProfile: {
      ...riderProfile,
      verificationStatus: 'pending',
      availabilityStatus: {
        isOnline: false,
        status: 'offline'
      },
      earnings: {
        totalEarnings: 0,
        pendingPayout: 0,
        totalDeliveries: 0,
        averageRating: 0,
        totalTips: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0
      },
      performance: {
        completionRate: 0,
        averageDeliveryTime: 0,
        onTimeRate: 0,
        cancellationRate: 0
      }
    }
  });

  // Generate token (you might want to use your auth system)
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    message: 'Rider registration submitted for verification',
    data: {
      user,
      token
    }
  });
});

// @desc    Get rider profile
// @route   GET /api/riders/profile
// @access  Private (Rider)
export const getRiderProfile = asyncHandler(async (req, res) => {
  const rider = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: {
      rider
    }
  });
});

// @desc    Update rider profile
// @route   PUT /api/riders/profile
// @access  Private (Rider)
export const updateRiderProfile = asyncHandler(async (req, res) => {
  const updates = {};
  
  if (req.body.profile) {
    updates.profile = { ...req.user.profile, ...req.body.profile };
  }
  
  if (req.body.riderProfile) {
    updates.riderProfile = { ...req.user.riderProfile, ...req.body.riderProfile };
  }

  const rider = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      rider
    }
  });
});

// @desc    Update rider availability
// @route   PUT /api/riders/availability
// @access  Private (Rider)
export const updateAvailability = asyncHandler(async (req, res) => {
  const { isOnline, status } = req.body;

  const rider = await User.findByIdAndUpdate(
    req.user.id,
    {
      'riderProfile.availabilityStatus.isOnline': isOnline,
      'riderProfile.availabilityStatus.status': status,
      'riderProfile.availabilityStatus.lastOnline': new Date()
    },
    { new: true }
  );

  res.json({
    success: true,
    message: `You are now ${isOnline ? 'online' : 'offline'}`,
    data: {
      availability: rider.riderProfile.availabilityStatus
    }
  });
});

// @desc    Update rider location
// @route   PUT /api/riders/location
// @access  Private (Rider)
export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  const rider = await User.findByIdAndUpdate(
    req.user.id,
    {
      'riderProfile.currentLocation': {
        coordinates: { lat, lng },
        lastUpdated: new Date()
      }
    },
    { new: true }
  );

  // Update active orders with location tracking
  await Order.updateMany(
    { 
      'deliveryDetails.riderId': req.user.id,
      status: { $in: ['pickedup', 'out_for_delivery'] }
    },
    {
      $push: {
        'deliveryDetails.riderLocationUpdates': {
          coordinates: { lat, lng },
          timestamp: new Date()
        }
      }
    }
  );

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location: rider.riderProfile.currentLocation
    }
  });
});

// @desc    Get available orders for rider
// @route   GET /api/riders/orders/available
// @access  Private (Rider)
export const getAvailableOrders = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 10 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Current location coordinates are required'
    });
  }

  const availableOrders = await Order.aggregate([
    {
      $match: {
        status: 'ready',
        'deliveryDetails.riderId': { $exists: false }
      }
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurantId',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$restaurant'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $unwind: '$customer'
    },
    {
      $addFields: {
        distance: {
          $sqrt: {
            $add: [
              { $pow: [{ $subtract: [parseFloat(lat), '$restaurant.contact.address.coordinates.lat'] }, 2] },
              { $pow: [{ $subtract: [parseFloat(lng), '$restaurant.contact.address.coordinates.lng'] }, 2] }
            ]
          }
        }
      }
    },
    {
      $match: {
        distance: { $lte: maxDistance / 111.12 }
      }
    },
    {
      $sort: { createdAt: 1 }
    },
    {
      $project: {
        orderId: 1,
        grandTotal: 1,
        deliveryFee: 1,
        deliveryAddress: 1,
        estimatedDelivery: 1,
        preparationTime: 1,
        restaurant: {
          name: 1,
          'contact.address': 1,
          'contact.phone': 1
        },
        customer: {
          'profile.firstName': 1,
          'profile.lastName': 1,
          'profile.phone': 1
        },
        distance: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      orders: availableOrders
    }
  });
});

// @desc    Accept order
// @route   POST /api/riders/orders/:orderId/accept
// @access  Private (Rider)
export const acceptOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: 'ready',
      'deliveryDetails.riderId': { $exists: false }
    },
    {
      'deliveryDetails.riderId': req.user.id,
      'deliveryDetails.assignedAt': new Date(),
      status: 'pickedup'
    },
    { new: true }
  ).populate('restaurantId userId');

  if (!order) {
    return res.status(400).json({
      success: false,
      message: 'Order not available for delivery'
    });
  }

  // Update rider status to busy
  await User.findByIdAndUpdate(req.user.id, {
    'riderProfile.availabilityStatus.status': 'busy'
  });

  // Send notifications
  await createNotification(
    order.restaurantId.ownerId,
    'Rider Assigned',
    `Rider has been assigned to order ${order.orderId}`,
    'order',
    { orderId: order._id }
  );

  await createNotification(
    order.userId._id,
    'Rider On The Way',
    'A rider is coming to pick up your order',
    'order',
    { orderId: order._id }
  );

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: {
      order
    }
  });
});

// @desc    Reject order
// @route   POST /api/riders/orders/:orderId/reject
// @access  Private (Rider)
export const rejectOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    status: 'ready'
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Log the rejection (you might want to create a separate collection for this)
  console.log(`Rider ${req.user.id} rejected order ${orderId}: ${reason}`);

  res.json({
    success: true,
    message: 'Order rejected successfully'
  });
});

// @desc    Get current delivery
// @route   GET /api/riders/orders/current
// @access  Private (Rider)
export const getCurrentDelivery = asyncHandler(async (req, res) => {
  const currentOrder = await Order.findOne({
    'deliveryDetails.riderId': req.user.id,
    status: { $in: ['pickedup', 'out_for_delivery'] }
  })
    .populate('restaurantId', 'name contact address')
    .populate('userId', 'profile firstName lastName phone')
    .populate('items.foodItemId', 'name');

  res.json({
    success: true,
    data: {
      order: currentOrder
    }
  });
});

// @desc    Get delivery history
// @route   GET /api/riders/orders/history
// @access  Private (Rider)
export const getDeliveryHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({
    'deliveryDetails.riderId': req.user.id,
    status: 'delivered'
  })
    .populate('restaurantId', 'name')
    .populate('userId', 'profile firstName lastName')
    .sort({ 'deliveryDetails.deliveredAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments({
    'deliveryDetails.riderId': req.user.id,
    status: 'delivered'
  });

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

// @desc    Confirm pickup
// @route   POST /api/riders/orders/:orderId/confirm-pickup
// @access  Private (Rider)
export const confirmPickup = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      'deliveryDetails.riderId': req.user.id,
      status: 'pickedup'
    },
    {
      'deliveryDetails.pickedUpAt': new Date(),
      status: 'out_for_delivery'
    },
    { new: true }
  ).populate('userId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not assigned to you'
    });
  }

  // Send notification to customer
  await createNotification(
    order.userId._id,
    'Order Picked Up',
    'Your order has been picked up and is on the way',
    'order',
    { orderId: order._id }
  );

  res.json({
    success: true,
    message: 'Pickup confirmed successfully',
    data: {
      order
    }
  });
});

// @desc    Confirm delivery
// @route   POST /api/riders/orders/:orderId/confirm-delivery
// @access  Private (Rider)
export const confirmDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { image, signature, notes } = req.body;

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      'deliveryDetails.riderId': req.user.id,
      status: 'out_for_delivery'
    },
    {
      'deliveryDetails.deliveredAt': new Date(),
      'deliveryDetails.deliveryProof': {
        image,
        signature,
        notes
      },
      status: 'delivered'
    },
    { new: true }
  ).populate('userId restaurantId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not assigned to you'
    });
  }

  // Update rider stats and earnings
  await User.findByIdAndUpdate(req.user.id, {
    $inc: {
      'riderProfile.earnings.totalDeliveries': 1,
      'riderProfile.earnings.pendingPayout': order.deliveryFee,
      'riderProfile.earnings.totalEarnings': order.deliveryFee
    },
    'riderProfile.availabilityStatus.status': 'available'
  });

  // Send notifications
  await createNotification(
    order.userId._id,
    'Order Delivered',
    'Your order has been delivered successfully',
    'order',
    { orderId: order._id }
  );

  await createNotification(
    order.restaurantId.ownerId,
    'Order Delivered',
    `Order ${order.orderId} has been delivered to customer`,
    'order',
    { orderId: order._id }
  );

  res.json({
    success: true,
    message: 'Delivery confirmed successfully',
    data: {
      order
    }
  });
});

// @desc    Get rider earnings
// @route   GET /api/riders/earnings
// @access  Private (Rider)
export const getRiderEarnings = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.params;

  const startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

  const earningsData = await Order.aggregate([
    {
      $match: {
        'deliveryDetails.riderId': req.user.id,
        status: 'delivered',
        'deliveryDetails.deliveredAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$deliveryFee' },
        totalDeliveries: { $sum: 1 },
        averageEarning: { $avg: '$deliveryFee' }
      }
    }
  ]);

  // Weekly breakdown for charts
  const weeklyBreakdown = await Order.aggregate([
    {
      $match: {
        'deliveryDetails.riderId': req.user.id,
        status: 'delivered',
        'deliveryDetails.deliveredAt': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $week: '$deliveryDetails.deliveredAt' },
        weeklyEarnings: { $sum: '$deliveryFee' },
        deliveries: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const rider = await User.findById(req.user.id);

  res.json({
    success: true,
    data: {
      earnings: earningsData[0] || { totalEarnings: 0, totalDeliveries: 0, averageEarning: 0 },
      weeklyBreakdown,
      currentBalance: rider.riderProfile.earnings
    }
  });
});

// @desc    Get rider statistics
// @route   GET /api/riders/stats
// @access  Private (Rider)
export const getRiderStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await Order.aggregate([
    {
      $match: {
        'deliveryDetails.riderId': req.user.id,
        'deliveryDetails.deliveredAt': { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalDeliveries: { $sum: 1 },
        totalEarnings: { $sum: '$deliveryFee' },
        averageDeliveryTime: { 
          $avg: {
            $subtract: [
              '$deliveryDetails.deliveredAt',
              '$deliveryDetails.pickedUpAt'
            ]
          }
        },
        onTimeDeliveries: {
          $sum: {
            $cond: [
              { $lte: ['$deliveryDetails.deliveredAt', '$estimatedDelivery'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const currentStats = stats[0] || {
    totalDeliveries: 0,
    totalEarnings: 0,
    averageDeliveryTime: 0,
    onTimeDeliveries: 0
  };

  const completionRate = currentStats.totalDeliveries > 0 ? 
    (currentStats.onTimeDeliveries / currentStats.totalDeliveries) * 100 : 0;

  res.json({
    success: true,
    data: {
      stats: {
        ...currentStats,
        completionRate: Math.round(completionRate),
        averageDeliveryTime: Math.round(currentStats.averageDeliveryTime / (1000 * 60)) // Convert to minutes
      }
    }
  });
});

// @desc    Get rider ratings
// @route   GET /api/riders/ratings
// @access  Private (Rider)
export const getRiderRatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({
    'deliveryDetails.riderId': req.user.id,
    status: 'delivered',
    rating: { $exists: true, $gte: 1 }
  })
    .populate('userId', 'profile firstName lastName')
    .select('orderId rating review createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments({
    'deliveryDetails.riderId': req.user.id,
    status: 'delivered',
    rating: { $exists: true, $gte: 1 }
  });

  const averageRating = await Order.aggregate([
    {
      $match: {
        'deliveryDetails.riderId': req.user.id,
        status: 'delivered',
        rating: { $exists: true, $gte: 1 }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      ratings: orders,
      averageRating: averageRating[0]?.averageRating || 0,
      totalRatings: averageRating[0]?.totalRatings || 0,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Upload rider documents
// @route   POST /api/riders/documents
// @access  Private (Rider)
export const uploadRiderDocuments = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No document uploaded'
    });
  }

  const { documentType } = req.body;
  const documentUrl = `/uploads/${req.file.filename}`;

  const rider = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: {
        'riderProfile.documents': {
          type: documentType,
          documentUrl,
          verified: false,
          uploadedAt: new Date()
        }
      }
    },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      documents: rider.riderProfile.documents
    }
  });
});