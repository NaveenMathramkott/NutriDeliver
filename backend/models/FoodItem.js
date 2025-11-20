const mongoose = require('mongoose');

// Defines the structure for foodItem documents with fields 
const foodItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  calories: {
    type: Number,
    required: [true, 'Calories information is required']
  },
  protein: {
    type: Number,
    required: true
  },
  carbs: {
    type: Number,
    required: true
  },
  fat: {
    type: Number,
    required: true
  },
  ingredients: [{
    type: String,
    required: true
  }],
  dietaryTags: [{
    type: String,
    enum: [
      'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 
      'low-carb', 'high-protein', 'keto', 'paleo', 'sugar-free', 
      'organic', 'non-gmo'
    ]
  }],
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  preparationTime: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  nutritionalInfo: {
    servingSize: String,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    cholesterol: Number,
    vitamins: [{
      name: String,
      amount: String
    }]
  },
  customizationOptions: [{
    name: String,
    options: [{
      name: String,
      price: Number
    }]
  }]
}, {
  timestamps: true
});

// Index for restaurant queries
foodItemSchema.index({ restaurantId: 1 });

// Index for category filtering
foodItemSchema.index({ categoryId: 1 });

// Index for availability filter
foodItemSchema.index({ isAvailable: 1 });

// Index for price sorting/filtering
foodItemSchema.index({ price: 1 });

// Index for calorie-based queries
foodItemSchema.index({ calories: 1 });

// Index for dietary preferences
foodItemSchema.index({ dietaryTags: 1 });

// Index for top-rated items (descending)
foodItemSchema.index({ rating: -1 });

// Index for restaurant's available items
foodItemSchema.index({ restaurantId: 1, isAvailable: 1 });

// Index for category's available items
foodItemSchema.index({ categoryId: 1, isAvailable: 1 });

module.exports = mongoose.model('FoodItem', foodItem);