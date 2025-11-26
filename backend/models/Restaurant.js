import mongoose from 'mongoose';

// Defines the structure for Restautrant with fields and validations
const restaurantSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  cuisineType: {
    type: String,
    required: [true, 'Cuisine type is required'],
    enum: ['healthy', 'salads', 'protein', 'vegan', 'vegetarian', 'gluten-free', 'keto', 'mediterranean', 'smoothies']
  },
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      coordinates: {
        lat: {
          type: Number,
          required: true
        },
        lng: {
          type: Number,
          required: true
        }
      }
    }
  },
  operatingHours: {
    opening: {
      type: String,
      required: true
    },
    closing: {
      type: String,
      required: true
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String
  },
  deliverySettings: {
    deliveryFee: {
      type: Number,
      default: 2.99
    },
    minOrderAmount: {
      type: Number,
      default: 15
    },
    deliveryRadius: {
      type: Number,
      default: 10 // in kilometers
    },
    estimatedDeliveryTime: {
      type: Number,
      default: 30 // in minutes
    }
  }
}, {
  timestamps: true
});

// Index for owner's restaurant queries
restaurantSchema.index({ ownerId: 1 });

// Geospatial index for location-based searches
restaurantSchema.index({ 'contact.address.coordinates': '2dsphere' });

// Index for cuisine type filtering
restaurantSchema.index({ cuisineType: 1 });

// Index for top-rated restaurants (descending)
restaurantSchema.index({ rating: -1 });

// Virtual for average rating calculation (access)
restaurantSchema.virtual('averageRating').get(function() {
  return this.rating;
});

export default mongoose.model('Restaurant', restaurantSchema);