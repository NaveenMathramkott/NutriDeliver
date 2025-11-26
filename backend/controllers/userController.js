import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const updates = {};
  
  if (req.body.profile) {
    updates.profile = { ...req.user.profile, ...req.body.profile };
  }
  
  if (req.file) {
    updates.profile = updates.profile || { ...req.user.profile };
    updates.profile.avatar = `/uploads/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
export const updatePreferences = asyncHandler(async (req, res) => {
  const { dietaryRestrictions, allergies, calorieGoal, preferredCuisines, spiceLevel } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      preferences: {
        dietaryRestrictions,
        allergies,
        calorieGoal,
        preferredCuisines,
        spiceLevel
       }
     },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      user
    }
  });
});

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
export const getUserAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('addresses');
  
  res.json({
    success: true,
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Add user address
// @route   POST /api/users/addresses
// @access  Private
export const addUserAddress = asyncHandler(async (req, res) => {
  const { type, label, street, apartment, city, state, zipCode, coordinates, instructions } = req.body;

  const address = {
    type,
    label,
    street,
    apartment,
    city,
    state,
    zipCode,
    coordinates,
    instructions
  };

  // If this is set as default, remove default from other addresses
  if (req.body.isDefault) {
    address.isDefault = true;
    await User.updateMany(
      { _id: req.user.id, 'addresses.isDefault': true },
      { $set: { 'addresses.$.isDefault': false } }
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { addresses: address } },
    { new: true }
  );

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Update user address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
export const updateUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const updates = req.body;

  const user = await User.findById(req.user.id);
  const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);

  if (addressIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Address not found'
    });
  }

  // If setting as default, remove default from other addresses
  if (updates.isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // Update the specific address
  user.addresses[addressIndex] = {
    ...user.addresses[addressIndex].toObject(),
    ...updates
  };

  await user.save();

  res.json({
    success: true,
    message: 'Address updated successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Delete user address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
export const deleteUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { addresses: { _id: addressId } } },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Address deleted successfully',
    data: {
      addresses: user.addresses
    }
  });
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
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

// @desc    Get user order by ID
// @route   GET /api/users/orders/:orderId
// @access  Private
export const getUserOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id
  })
    .populate('restaurantId', 'name images contact operatingHours')
    .populate('items.foodItemId', 'name images price calories')
    .populate('riderId', 'profile firstName lastName phone');

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

// @desc    Update notification preferences
// @route   PUT /api/users/notification-preferences
// @access  Private
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, push, sms } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      notificationPreferences: {
        email: email || req.user.notificationPreferences?.email,
        push: push || req.user.notificationPreferences?.push,
        sms: sms || req.user.notificationPreferences?.sms
      }
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      user
    }
  });
});