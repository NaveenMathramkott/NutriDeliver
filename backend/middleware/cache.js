import NodeCache from "node-cache";

// Create cache instance with 10 minutes TTL
export const cache = new NodeCache({ stdTTL: 600 });

// Middleware to cache API responses
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    // Serve cached data if available
    // Cache new responses automatically
    if (cachedResponse) {
      console.log("Serving from cache:", key);
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data) {
      cache.set(key, data, duration);
      originalJson.call(this, data);
    };

    next();
  };
};

// Clear cache for specific keys or array of keys
export const clearCache = (keys) => {
  // Delete single key or multiple keys
  if (Array.isArray(keys)) {
    keys.forEach((key) => cache.del(key));
  } else {
    cache.del(keys);
  }
};

// Clear cache by pattern
export const clearCacheByPattern = (pattern) => {
  // Find keys containing pattern
  const keys = cache.keys();
  // Delete all matching keys
  const keysToDelete = keys.filter((key) => key.includes(pattern));
  keysToDelete.forEach((key) => cache.del(key));
};
