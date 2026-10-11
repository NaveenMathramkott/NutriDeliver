import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "system",
    },
    platform: {
      name: { type: String, trim: true, default: "NutriDeliver" },
      description: {
        type: String,
        trim: true,
        default: "Healthy Food Delivery Platform",
      },
      contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: "admin@nutrideliver.com",
      },
      supportPhone: { type: String, trim: true, default: "+1-555-0123" },
    },
    delivery: {
      baseFee: { type: Number, min: 0, default: 2.99 },
      minOrderAmount: { type: Number, min: 0, default: 15 },
      maxDeliveryDistance: { type: Number, min: 0, default: 10 },
      estimatedDeliveryTime: { type: Number, min: 0, default: 30 },
    },
    payments: {
      currency: { type: String, uppercase: true, trim: true, default: "USD" },
      stripeEnabled: { type: Boolean, default: true },
      cashOnDelivery: { type: Boolean, default: true },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Settings", settingsSchema);
