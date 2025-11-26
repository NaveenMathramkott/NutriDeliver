import mongoose from 'mongoose';

// Validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]{10,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  coordinates: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
};

// Common validation rules
export const validationRules = {
  required: (value) => !!value || 'This field is required',
  email: (value) => patterns.email.test(value) || 'Please enter a valid email address',
  phone: (value) => patterns.phone.test(value) || 'Please enter a valid phone number',
  minLength: (min) => (value) => 
    value.length >= min || `Must be at least ${min} characters`,
  maxLength: (max) => (value) => 
    value.length <= max || `Must be less than ${max} characters`,
  minValue: (min) => (value) => 
    value >= min || `Must be at least ${min}`,
  maxValue: (max) => (value) => 
    value <= max || `Must be less than ${max}`,
  number: (value) => !isNaN(value) || 'Must be a number',
  positive: (value) => value > 0 || 'Must be a positive number',
  objectId: (value) => mongoose.Types.ObjectId.isValid(value) || 'Invalid ID format',
  url: (value) => patterns.url.test(value) || 'Please enter a valid URL',
  coordinates: (value) => patterns.coordinates.test(value) || 'Invalid coordinates format'
};

// Validate object against schema
export const validateObject = (obj, schema) => {
  const errors = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) {
        errors[key] = result;
        break;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize and validate input data
export const sanitizeAndValidate = (data, schema) => {
  const sanitized = {};
  const errors = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    let value = data[key];
    
    // Skip validation if field is undefined and not required
    if (value === undefined) {
      const hasRequiredRule = rules.some(rule => 
        rule.toString().includes('required') && value === undefined
      );
      if (hasRequiredRule) {
        errors[key] = 'This field is required';
      }
      continue;
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') value = undefined;
    }
    
    sanitized[key] = value;
    
    // Apply validation rules
    for (const rule of rules) {
      if (value === undefined) break;
      
      const result = rule(value);
      if (result !== true) {
        errors[key] = result;
        break;
      }
    }
  }
  
  return {
    data: sanitized,
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation schemas
export const validationSchemas = {
  userRegistration: {
    email: [validationRules.required, validationRules.email],
    password: [
      validationRules.required,
      validationRules.minLength(6)
    ],
    'profile.firstName': [validationRules.required, validationRules.minLength(2)],
    'profile.lastName': [validationRules.required, validationRules.minLength(2)],
    'profile.phone': [validationRules.phone]
  },
  
  restaurant: {
    name: [validationRules.required, validationRules.minLength(2)],
    description: [validationRules.required, validationRules.minLength(10)],
    'contact.email': [validationRules.required, validationRules.email],
    'contact.phone': [validationRules.required, validationRules.phone],
    'contact.address.street': [validationRules.required],
    'contact.address.city': [validationRules.required],
    'contact.address.state': [validationRules.required],
    'contact.address.zipCode': [validationRules.required, validationRules.zipCode]
  },
  
  foodItem: {
    name: [validationRules.required, validationRules.minLength(2)],
    description: [validationRules.required, validationRules.minLength(10)],
    price: [validationRules.required, validationRules.positive],
    calories: [validationRules.required, validationRules.positive],
    protein: [validationRules.required, validationRules.positive],
    carbs: [validationRules.required, validationRules.positive],
    fat: [validationRules.required, validationRules.positive],
    preparationTime: [validationRules.required, validationRules.positive]
  },
  
  address: {
    type: [validationRules.required],
    street: [validationRules.required],
    city: [validationRules.required],
    state: [validationRules.required],
    zipCode: [validationRules.required, validationRules.zipCode]
  }
};