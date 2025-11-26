import Cart from '../models/Cart.js';
import FoodItem from '../models/FoodItem.js';
import Offer from '../models/Offer.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private (User)
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.foodItemId', 'name price images isAvailable calories restaurantId')
    .populate('restaurantId', 'name images');

  if (!cart) {
    cart = await Cart.create({ userId: req.user.id, items: [], totalAmount: 0 });
  }

  // Check item availability and remove unavailable items
  const availableItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    if (item.foodItemId && item.foodItemId.isAvailable) {
      availableItems.push(item);
      totalAmount += item.quantity * item.price;
    }
  }

  // Update cart if items were removed
  if (availableItems.length !== cart.items.length) {
    cart.items = availableItems;
    cart.totalAmount = totalAmount;
    await cart.save();
  }

  res.json({
    success: true,
    data: {
      cart
    }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private (User)
export const addToCart = asyncHandler(async (req, res) => {
  const { foodItemId, quantity = 1, specialInstructions } = req.body;

  // Validate food item
  const foodItem = await FoodItem.findOne({ 
    _id: foodItemId, 
    isAvailable: true 
  }).populate('restaurantId');

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found or unavailable'
    });
  }

  let cart = await Cart.findOne({ userId: req.user.id });

  // Create new cart if doesn't exist
  if (!cart) {
    cart = await Cart.create({
      userId: req.user.id,
      restaurantId: foodItem.restaurantId._id,
      items: [],
      totalAmount: 0
    });
  }

  // Check if cart already has items from different restaurant
  if (cart.restaurantId && 
      cart.restaurantId.toString() !== foodItem.restaurantId._id.toString() &&
      cart.items.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart contains items from another restaurant. Please clear your cart first.'
    });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.foodItemId.toString() === foodItemId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].specialInstructions = specialInstructions;
  } else {
    // Add new item
    cart.items.push({
      foodItemId,
      quantity,
      price: foodItem.price,
      specialInstructions
    });
  }

  // Update restaurant ID if this is the first item
  if (!cart.restaurantId) {
    cart.restaurantId = foodItem.restaurantId._id;
  }

  // Calculate total amount
  cart.totalAmount = cart.items.reduce((total, item) => {
    return total + (item.quantity * item.price);
  }, 0);

  await cart.save();
  await cart.populate('items.foodItemId', 'name price images calories');
  await cart.populate('restaurantId', 'name images');

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      cart
    }
  });
});

// @desc    Update cart item
// @route   PUT /api/cart/update/:itemId
// @access  Private (User)
export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity, specialInstructions } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found in cart'
    });
  }

  // Update item
  if (quantity !== undefined) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  }

  if (specialInstructions !== undefined) {
    cart.items[itemIndex].specialInstructions = specialInstructions;
  }

  // Recalculate total
  cart.totalAmount = cart.items.reduce((total, item) => {
    return total + (item.quantity * item.price);
  }, 0);

  await cart.save();
  await cart.populate('items.foodItemId', 'name price images calories');
  await cart.populate('restaurantId', 'name images');

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: {
      cart
    }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private (User)
export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found in cart'
    });
  }

  // Remove item
  cart.items.splice(itemIndex, 1);

  // Recalculate total
  cart.totalAmount = cart.items.reduce((total, item) => {
    return total + (item.quantity * item.price);
  }, 0);

  // Clear restaurant if cart is empty
  if (cart.items.length === 0) {
    cart.restaurantId = null;
  }

  await cart.save();
  await cart.populate('items.foodItemId', 'name price images calories');
  await cart.populate('restaurantId', 'name images');

  res.json({
    success: true,
    message: 'Item removed from cart successfully',
    data: {
      cart
    }
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private (User)
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = [];
  cart.totalAmount = 0;
  cart.restaurantId = null;
  cart.appliedOffer = null;

  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cart
    }
  });
});

// @desc    Apply offer to cart
// @route   POST /api/cart/apply-offer
// @access  Private (User)
export const applyOfferToCart = asyncHandler(async (req, res) => {
  const { offerCode } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.foodItemId');
  
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  const offer = await Offer.findOne({
    code: offerCode,
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });

  if (!offer) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired offer code'
    });
  }

  // Check minimum order amount
  if (cart.totalAmount < offer.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount of $${offer.minOrderAmount} required for this offer`
    });
  }

  // Check usage limit
  if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'This offer has reached its usage limit'
    });
  }

  // Calculate discount
  let discountAmount = 0;
  if (offer.discountType === 'percentage') {
    discountAmount = (cart.totalAmount * offer.discountValue) / 100;
    if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
      discountAmount = offer.maxDiscount;
    }
  } else {
    discountAmount = offer.discountValue;
  }

  // Apply discount
  cart.appliedOffer = {
    offerId: offer._id,
    code: offer.code,
    discountAmount
  };

  await cart.save();

  res.json({
    success: true,
    message: 'Offer applied successfully',
    data: {
      cart,
      discount: discountAmount,
      finalAmount: cart.totalAmount - discountAmount
    }
  });
});