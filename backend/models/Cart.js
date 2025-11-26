import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  items: [{
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    specialInstructions: String
  }],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  appliedOffer: {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer'
    },
    code: String,
    discountAmount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});


export default mongoose.model('Cart', cartSchema);