import Joi from 'joi';

// User validation schemas
export const validateRegister = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().optional(),
      dateOfBirth: Joi.date().optional()
    }).required(),
    role: Joi.string().valid('user', 'restaurant', 'rider').default('user')
  });

  return schema.validate(data);
};

export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

export const validateUserUpdate = (data) => {
  const schema = Joi.object({
    profile: Joi.object({
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      phone: Joi.string().optional(),
      avatar: Joi.string().optional(),
      dateOfBirth: Joi.date().optional()
    }).optional(),
    preferences: Joi.object({
      dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
      allergies: Joi.array().items(Joi.string()).optional(),
      calorieGoal: Joi.number().optional()
    }).optional()
  });

  return schema.validate(data);
};

// Restaurant validation schemas
export const validateRestaurant = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    cuisineType: Joi.string().valid(
      'healthy', 'salads', 'protein', 'vegan', 'vegetarian', 
      'gluten-free', 'keto', 'mediterranean', 'smoothies'
    ).required(),
    contact: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().required(),
          lng: Joi.number().required()
        }).required()
      }).required()
    }).required(),
    operatingHours: Joi.object({
      opening: Joi.string().required(),
      closing: Joi.string().required(),
      days: Joi.array().items(Joi.string().valid(
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      )).required()
    }).required()
  });

  return schema.validate(data);
};

// Food item validation schemas
export const validateFoodItem = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    categoryId: Joi.string().required(),
    price: Joi.number().min(0).required(),
    calories: Joi.number().required(),
    protein: Joi.number().required(),
    carbs: Joi.number().required(),
    fat: Joi.number().required(),
    ingredients: Joi.array().items(Joi.string()).required(),
    dietaryTags: Joi.array().items(Joi.string().valid(
      'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free',
      'low-carb', 'high-protein', 'keto', 'paleo', 'sugar-free',
      'organic', 'non-gmo'
    )).optional(),
    preparationTime: Joi.number().min(1).required(),
    isAvailable: Joi.boolean().optional()
  });

  return schema.validate(data);
};

// Order validation schemas
export const validateOrder = (data) => {
  const schema = Joi.object({
    items: Joi.array().items(Joi.object({
      foodItemId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      specialInstructions: Joi.string().optional(),
      customization: Joi.array().items(Joi.object({
        option: Joi.string().required(),
        choice: Joi.string().required(),
        price: Joi.number().min(0).optional()
      })).optional()
    })).min(1).required(),
    deliveryAddress: Joi.object({
      type: Joi.string().valid('home', 'work', 'other').default('home'),
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required()
      }).optional()
    }).required(),
    paymentMethod: Joi.string().valid('card', 'cash', 'digital_wallet').required(),
    specialInstructions: Joi.string().optional()
  });

  return schema.validate(data);
};

// Rider validation schemas
export const validateRiderRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      dateOfBirth: Joi.date().required()
    }).required(),
    riderProfile: Joi.object({
      vehicleType: Joi.string().valid('bicycle', 'motorcycle', 'car', 'scooter').required(),
      vehicleNumber: Joi.string().required(),
      licenseNumber: Joi.string().required()
    }).required()
  });

  return schema.validate(data);
};

export const validateRiderLocation = (data) => {
  const schema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  });

  return schema.validate(data);
};

// Validation middleware
export const validate = (validator) => {
  return (req, res, next) => {
    const { error } = validator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};