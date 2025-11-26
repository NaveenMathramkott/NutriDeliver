import Stripe from 'stripe';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private (User)
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id,
    paymentStatus: 'pending'
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or already processed'
    });
  }

  // Create payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.grandTotal * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      orderId: order._id.toString(),
      userId: req.user.id
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  });
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private (User)
export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed'
    });
  }

  // Update order payment status
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      userId: req.user.id
    },
    {
      paymentStatus: 'paid',
      status: 'confirmed'
    },
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
    message: 'Payment confirmed successfully',
    data: {
      order
    }
  });
});

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (Admin, Restaurant)
export const processRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check permissions
  if (req.user.role === 'restaurant') {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant || order.restaurantId.toString() !== restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this order'
      });
    }
  }

  // Create refund with Stripe
  // Note: In a real implementation, you'd need to store payment intent IDs
  // const refund = await stripe.refunds.create({
  //   payment_intent: order.paymentIntentId,
  //   amount: Math.round(amount * 100),
  // });

  // For demo purposes, we'll just update the order status
  order.paymentStatus = 'refunded';
  await order.save();

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: {
      order
    }
  });
});

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private (User)
export const getPaymentMethods = asyncHandler(async (req, res) => {
  // In a real implementation, you'd retrieve saved payment methods from Stripe
  // For demo purposes, return empty array
  res.json({
    success: true,
    data: {
      paymentMethods: []
    }
  });
});

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private (User)
export const addPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.body;

  // In a real implementation, you'd attach the payment method to the customer
  // For demo purposes, just return success
  res.json({
    success: true,
    message: 'Payment method added successfully'
  });
});

// @desc    Remove payment method
// @route   DELETE /api/payments/methods/:methodId
// @access  Private (User)
export const removePaymentMethod = asyncHandler(async (req, res) => {
  const { methodId } = req.params;

  // In a real implementation, you'd detach the payment method from the customer
  // For demo purposes, just return success
  res.json({
    success: true,
    message: 'Payment method removed successfully'
  });
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private (User)
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({
    userId: req.user.id,
    paymentStatus: 'paid'
  })
    .select('orderId grandTotal paymentStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments({
    userId: req.user.id,
    paymentStatus: 'paid'
  });

  res.json({
    success: true,
    data: {
      payments: orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});