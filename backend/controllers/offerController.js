import Offer from '../models/Offer.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get active offers
// @route   GET /api/offers
// @access  Public
export const getActiveOffers = asyncHandler(async (req, res) => {
  const { restaurantId, categoryId } = req.query;

  const query = {
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  };

  if (restaurantId) {
    query.$or = [
      { applicableRestaurants: { $in: [restaurantId] } },
      { applicableRestaurants: { $size: 0 } }
    ];
  }

  if (categoryId) {
    query.$or = [
      { applicableCategories: { $in: [categoryId] } },
      { applicableCategories: { $size: 0 } }
    ];
  }

  const offers = await Offer.find(query).sort({ validUntil: 1 });

  res.json({
    success: true,
    data: {
      offers
    }
  });
});

// @desc    Get offer by ID
// @route   GET /api/offers/:id
// @access  Public
export const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  res.json({
    success: true,
    data: {
      offer
    }
  });
});

// @desc    Validate offer code
// @route   POST /api/offers/validate
// @access  Private (User)
export const validateOffer = asyncHandler(async (req, res) => {
  const { code, cartTotal, restaurantId } = req.body;

  const offer = await Offer.findOne({
    code,
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

  // Check usage limit
  if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'This offer has reached its usage limit'
    });
  }

  // Check minimum order amount
  if (cartTotal < offer.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount of $${offer.minOrderAmount} required`
    });
  }

  // Check restaurant applicability
  if (offer.applicableRestaurants.length > 0 && 
      !offer.applicableRestaurants.includes(restaurantId)) {
    return res.status(400).json({
      success: false,
      message: 'This offer is not applicable to this restaurant'
    });
  }

  // Calculate discount
  let discountAmount = 0;
  if (offer.discountType === 'percentage') {
    discountAmount = (cartTotal * offer.discountValue) / 100;
    if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
      discountAmount = offer.maxDiscount;
    }
  } else {
    discountAmount = offer.discountValue;
  }

  res.json({
    success: true,
    data: {
      valid: true,
      offer: {
        id: offer._id,
        code: offer.code,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount,
        minOrderAmount: offer.minOrderAmount,
        maxDiscount: offer.maxDiscount
      }
    }
  });
});

// @desc    Get all offers (Admin)
// @route   GET /api/offers/admin/all
// @access  Private (Admin)
export const getAllOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active } = req.query;

  const query = {};
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const offers = await Offer.find(query)
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
        total
      }
    }
  });
});

// @desc    Create offer
// @route   POST /api/offers
// @access  Private (Admin)
export const createOffer = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    validFrom,
    validUntil,
    usageLimit,
    applicableCategories,
    applicableRestaurants
  } = req.body;

  // Check if code already exists
  const existingOffer = await Offer.findOne({ code });
  if (existingOffer) {
    return res.status(400).json({
      success: false,
      message: 'Offer code already exists'
    });
  }

  const offer = await Offer.create({
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscount,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    usageLimit,
    applicableCategories: applicableCategories || [],
    applicableRestaurants: applicableRestaurants || []
  });

  res.status(201).json({
    success: true,
    message: 'Offer created successfully',
    data: {
      offer
    }
  });
});

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private (Admin)
export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  res.json({
    success: true,
    message: 'Offer updated successfully',
    data: {
      offer
    }
  });
});

// @desc    Delete offer
// @route   DELETE /api/offers/:id
// @access  Private (Admin)
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  res.json({
    success: true,
    message: 'Offer deleted successfully'
  });
});