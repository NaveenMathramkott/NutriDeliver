const mongoose = require("mongoose");

// Defines the structure for Order with fields and validations
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        foodItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FoodItem",
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        specialInstructions: String,
        customization: [
          {
            option: String,
            choice: String,
            price: Number,
          },
        ],
      },
    ],
    orderTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      type: {
        type: String,
        enum: ["home", "work", "other"],
        default: "home",
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "pickedup",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cash", "digital_wallet"],
      required: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 20,
    },
    specialInstructions: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
    deliveryDetails: {
      assignedAt: Date,
      pickedUpAt: Date,
      deliveredAt: Date,
      estimatedPickupTime: Date,
      estimatedDeliveryTime: Date,
      riderLocationUpdates: [
        {
          coordinates: {
            lat: Number,
            lng: Number,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      deliveryProof: {
        image: String,
        signature: String,
        notes: String,
      },
    },
    appliedOffer: {
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
      },
      code: String,
      discountAmount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// optimal query performance
// Index for user order queries
orderSchema.index({ userId: 1 });

// Index for restaurant order management
orderSchema.index({ restaurantId: 1 });

// Index for rider order assignments
orderSchema.index({ riderId: 1 });

// Index for status filtering
orderSchema.index({ status: 1 });

// Index for payment status checks
orderSchema.index({ paymentStatus: 1 });

// Index for latest orders first
orderSchema.index({ createdAt: -1 });

// Index for order ID lookups
orderSchema.index({ orderId: 1 });

// Compound indexes for common queries
// Index for user's orders by status
orderSchema.index({ userId: 1, status: 1 });

// Index for restaurant's orders by status
orderSchema.index({ restaurantId: 1, status: 1 });

// Index for rider's orders by status
orderSchema.index({ riderId: 1, status: 1 });

// Pre-save middleware to generate order ID
// Generate unique order ID with date and sequence
// Format: ND-YYYYMMDD-001
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Find the latest order for today to generate sequential number
    const latestOrder = await mongoose
      .model("Order")
      .findOne({
        orderId: new RegExp(`ND-${year}${month}${day}`),
      })
      .sort({ createdAt: -1 });

    let sequence = 1;
    if (latestOrder) {
      const lastSequence = parseInt(latestOrder.orderId.split("-")[3]);
      sequence = lastSequence + 1;
    }

    this.orderId = `ND-${year}${month}${day}-${String(sequence).padStart(
      3,
      "0"
    )}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
