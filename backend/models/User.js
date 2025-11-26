import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// Defines the structure for User documents with fields and validations
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'restaurant', 'rider', 'admin'],
    default: 'user'
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    dateOfBirth: {
      type: Date
    }
  },
  preferences: {
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'keto', 'paleo']
    }],
    allergies: [String],
    calorieGoal: Number
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
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
      lat: Number,
      lng: Number
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  riderProfile: {
    vehicleType: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car', 'scooter']
    },
    vehicleNumber: String,
    licenseNumber: String,
    licenseImage: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    availabilityStatus: {
      isOnline: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'offline'
      },
      lastOnline: Date
    },
    currentLocation: {
      coordinates: {
        lat: Number,
        lng: Number
      },
      lastUpdated: Date
    },
    earnings: {
      totalEarnings: {
        type: Number,
        default: 0
      },
      pendingPayout: {
        type: Number,
        default: 0
      },
      totalDeliveries: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0
      }
    },
    documents: [{
      type: {
        type: String,
        enum: ['license', 'insurance', 'vehicle_registration']
      },
      documentUrl: String,
      verified: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for email-based queries
userSchema.index({ email: 1 });

// Index for role-based filtering
userSchema.index({ role: 1 });

// Index for rider availability status
userSchema.index({ 'riderProfile.availabilityStatus.status': 1 });

// Geospatial index for rider location
userSchema.index({ 'riderProfile.currentLocation.coordinates': '2dsphere' });

// For Auto-hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);