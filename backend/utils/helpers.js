import mongoose from 'mongoose';

// Generate random string
export const generateRandomString = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate referral code
export const generateReferralCode = () => {
  return 'ND' + generateRandomString(6).toUpperCase();
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

// Format date and time
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate estimated delivery time
export const calculateEstimatedDelivery = (preparationTime, distance) => {
  const baseDeliveryTime = 15; // minutes
  const distanceTime = Math.ceil(distance * 3); // 3 minutes per km
  return preparationTime + baseDeliveryTime + distanceTime;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (basic validation)
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Generate order number
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ND${timestamp}${random}`;
};

// Calculate nutritional totals
export const calculateNutritionalTotals = (items) => {
  return items.reduce((totals, item) => {
    const foodItem = item.foodItemId;
    const quantity = item.quantity;
    
    return {
      calories: totals.calories + (foodItem.calories * quantity),
      protein: totals.protein + (foodItem.protein * quantity),
      carbs: totals.carbs + (foodItem.carbs * quantity),
      fat: totals.fat + (foodItem.fat * quantity)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

// Paginate results
export const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {};
  results.data = array.slice(startIndex, endIndex);
  results.pagination = {
    current: page,
    pages: Math.ceil(array.length / limit),
    total: array.length,
    hasNext: endIndex < array.length,
    hasPrev: startIndex > 0
  };
  
  return results;
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Delay function
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate slug from string
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Calculate average rating
export const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return parseFloat((sum / ratings.length).toFixed(1));
};

// Get time ago string
export const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};

// Generate calorie recommendation based on user profile
export const generateCalorieRecommendation = (age, gender, weight, height, activityLevel) => {
  // Basic BMR calculation (Mifflin-St Jeor Equation)
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  const maintenanceCalories = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
  
  return {
    maintenance: maintenanceCalories,
    mildLoss: maintenanceCalories - 250,
    weightLoss: maintenanceCalories - 500,
    weightGain: maintenanceCalories + 500
  };
};