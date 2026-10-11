// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error Stack:", err.stack);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: 400 };
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = { message: "Malformed JSON in request body", statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  // Respect a status carried by the error itself (e.g. from notFound or thrown HttpErrors)
  const statusCode = error.statusCode || err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Wrapper to avoid try-catch blocks in async functions
export const asyncHandler = (fn) => (req, res, next) => {
  // Automatically catch async errors
  // Pass errors to errorHandler middleware
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Handle 404 for undefined routes
export const notFound = (req, res, next) => {
  // Create error for non-existent routes
  // Pass to errorHandler middleware
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
