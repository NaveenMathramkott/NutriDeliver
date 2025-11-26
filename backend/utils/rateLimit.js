import rateLimit from 'express-rate-limit';

// Memory store for rate limiting (in production, use Redis)
const createMemoryStore = () => {
  const store = new Map();
  
  return {
    increment: (key, windowMs) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      for (const [k, data] of store.entries()) {
        if (data.firstRequest < windowStart) {
          store.delete(k);
        }
      }
      
      if (!store.has(key)) {
        store.set(key, {
          count: 1,
          firstRequest: now
        });
        return { totalHits: 1, resetTime: new Date(now + windowMs) };
      }
      
      const data = store.get(key);
      data.count += 1;
      return { totalHits: data.count, resetTime: new Date(data.firstRequest + windowMs) };
    },
    
    decrement: (key) => {
      if (store.has(key)) {
        const data = store.get(key);
        data.count = Math.max(0, data.count - 1);
      }
    },
    
    resetKey: (key) => {
      store.delete(key);
    }
  };
};

// Custom rate limit store
const customStore = createMemoryStore();

// Create rate limiters for different scenarios
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip,
    skip = (req) => false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    skipSuccessfulRequests,
    keyGenerator,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    // Custom store for more control
    store: {
      increment: (key) => customStore.increment(key, windowMs),
      decrement: (key) => customStore.decrement(key),
      resetKey: (key) => customStore.resetKey(key)
    }
  });
};

// Specific rate limiters
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.'
});

export const paymentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts, please try again later.'
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.'
});

export const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads, please try again later.'
});

// User-specific rate limiter
export const createUserRateLimiter = (maxRequests = 100) => {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.user ? req.user.id : req.ip;
    },
    message: 'Too many requests from your account, please try again later.'
  });
};

// API key rate limiter (for restaurants/riders)
export const createApiRateLimiter = (maxRequests = 1000) => {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.headers['x-api-key'] || req.ip;
    },
    message: 'API rate limit exceeded, please try again later.'
  });
};

// Dynamic rate limiting based on user role
export const dynamicRateLimiter = (req, res, next) => {
  let maxRequests = 100; // Default for unauthenticated users
  
  if (req.user) {
    switch (req.user.role) {
      case 'admin':
        maxRequests = 10000;
        break;
      case 'restaurant':
        maxRequests = 5000;
        break;
      case 'rider':
        maxRequests = 2000;
        break;
      case 'user':
        maxRequests = 1000;
        break;
      default:
        maxRequests = 1000;
    }
  }
  
  const limiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: maxRequests
  });
  
  limiter(req, res, next);
};

// Reset rate limit for specific key
export const resetRateLimit = (key) => {
  customStore.resetKey(key);
};

// Get rate limit info for a key
export const getRateLimitInfo = (key) => {
  // This would need to be implemented based on your store
  return customStore.getInfo?.(key) || null;
};