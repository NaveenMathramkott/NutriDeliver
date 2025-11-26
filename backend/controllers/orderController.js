import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import FoodItem from '../models/FoodItem.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Offer from '../models/Offer.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
export const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

  // Get user cart
  const cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.foodItemId')
    .populate('restaurantId');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Validate all items are available
  for (const item of cart.items) {
    if (!item.foodItemId.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Item "${item.foodItemId.name}" is no longer available`
      });
    }
  }

  // Calculate totals
  const orderTotal = cart.totalAmount;
  const deliveryFee = cart.restaurantId.deliverySettings?.deliveryFee || 2.99;
  const tax = (orderTotal * 0.1); // 10% tax
  const grandTotal = orderTotal + deliveryFee + tax - (cart.appliedOffer?.discountAmount || 0);

  // Create order
  const order = await Order.create({
    userId: req.user.id,
    restaurantId: cart.restaurantId._id,
    items: cart.items.map(item => ({
      foodItemId: item.foodItemId._id,
      name: item.foodItemId.name,
      quantity: item.quantity,
      price: item.price,
      specialInstructions: item.specialInstructions
    })),
    orderTotal,
    deliveryFee,
    tax,
    grandTotal,
    deliveryAddress,
    paymentMethod,
    specialInstructions,
    appliedOffer: cart.appliedOffer,
    estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
  });

  // Clear cart
  await Cart.findOneAndUpdate(
    { userId: req.user.id },
    { items: [], totalAmount: 0, restaurantId: null, appliedOffer: null }
  );

  // Increment usage count for offer
  if (cart.appliedOffer) {
    await Offer.findByIdAndUpdate(cart.appliedOffer.offerId, {
      $inc: { usedCount: 1 }
    });
  }

  // Update food item order counts
  for (const item of cart.items) {
    await FoodItem.findByIdAndUpdate(item.foodItemId._id, {
      $inc: { totalOrders: item.quantity }
    });
  }

  await order.populate('restaurantId', 'name contact');
  await order.populate('items.foodItemId', 'name images');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order
    }
  });
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private (User)
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { userId: req.user.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('restaurantId', 'name images')
    .populate('items.foodItemId', 'name images price')
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

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  let query = { _id: orderId };
  
  // Users can only see their own orders
  // Restaurants can see orders for their restaurant
  // Riders can see orders assigned to them
  // Admins can see all orders
  if (req.user.role === 'user') {
    query.userId = req.user.id;
  } else if (req.user.role === 'restaurant') {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (restaurant) {
      query.restaurantId = restaurant._id;
    }
  } else if (req.user.role === 'rider') {
    query.riderId = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('restaurantId', 'name images contact operatingHours')
    .populate('items.foodItemId', 'name images price calories')
    .populate('userId', 'profile firstName lastName phone')
    .populate('riderId', 'profile firstName lastName phone riderProfile');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: {
      order
    }
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:orderId/cancel
// @access  Private (User)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Only allow cancellation for pending or confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  order.status = 'cancelled';
  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: {
      order
    }
  });
});

// @desc    Rate order
// @route   POST /api/orders/:orderId/rate
// @access  Private (User)
export const rateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { rating, review } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id,
    status: 'delivered'
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not delivered'
    });
  }

  order.rating = rating;
  order.review = review;
  await order.save();

  // Update restaurant rating
  if (rating) {
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      const newTotalReviews = restaurant.totalReviews + 1;
      const newRating = ((restaurant.rating * restaurant.totalReviews) + rating) / newTotalReviews;
      
      restaurant.rating = parseFloat(newRating.toFixed(1));
      restaurant.totalReviews = newTotalReviews;
      await restaurant.save();
    }
  }

  res.json({
    success: true,
    message: 'Order rated successfully',
    data: {
      order
    }
  });
});

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/orders
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

// @desc    Update order status (Restaurant)
// @route   PUT /api/orders/:orderId/status
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

// @desc    Get available orders for riders
// @route   GET /api/orders/rider/available
// @access  Private (Rider)
export const getAvailableOrders = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 10 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Current location coordinates are required'
    });
  }

  // Find restaurants with ready orders within distance
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
        distance: { $lte: maxDistance / 111.12 } // Convert km to degrees (approximate)
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
        restaurant: {
          name: 1,
          'contact.address': 1
        },
        distance: 1,
        preparationTime: 1
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

// @desc    Accept order (Rider)
// @route   POST /api/orders/:orderId/accept
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
  );

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

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: {
      order
    }
  });
});

// @desc    Update delivery location
// @route   PUT /api/orders/:orderId/location
// @access  Private (Rider)
export const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { lat, lng } = req.body;

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      'deliveryDetails.riderId': req.user.id
    },
    {
      $push: {
        'deliveryDetails.riderLocationUpdates': {
          coordinates: { lat, lng },
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not assigned to you'
    });
  }

  // Update rider's current location
  await User.findByIdAndUpdate(req.user.id, {
    'riderProfile.currentLocation': {
      coordinates: { lat, lng },
      lastUpdated: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Location updated successfully'
  });
});

// @desc    Confirm pickup
// @route   POST /api/orders/:orderId/confirm-pickup
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
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not assigned to you'
    });
  }

  res.json({
    success: true,
    message: 'Pickup confirmed successfully',
    data: {
      order
    }
  });
});

// @desc    Confirm delivery
// @route   POST /api/orders/:orderId/confirm-delivery
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
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not assigned to you'
    });
  }

  // Update rider stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: {
      'riderProfile.earnings.totalDeliveries': 1,
      'riderProfile.earnings.pendingPayout': order.deliveryFee,
      'riderProfile.earnings.totalEarnings': order.deliveryFee
    },
    'riderProfile.availabilityStatus.status': 'available'
  });

  res.json({
    success: true,
    message: 'Delivery confirmed successfully',
    data: {
      order
    }
  });
});

// @desc    Get rider orders
// @route   GET /api/orders/rider/my-orders
// @access  Private (Rider)
export const getRiderOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { 'deliveryDetails.riderId': req.user.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('restaurantId', 'name contact')
    .populate('userId', 'profile firstName lastName phone')
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