const mongoose = require('mongoose');


// Defines the structure for category documents with fields and validation
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Category description is required']
  },
  image: {
    type: String,
    required: [true, 'Category image is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Creates index on name field for faster searching
categorySchema.index({ name: 1 });

// Creates index on isActive field for efficient filtering
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);