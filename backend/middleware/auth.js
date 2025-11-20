import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT token and authenticate user
export const authenticate = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token and get user data
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );
    const user = await User.findById(decoded.id).select("-password");

    // Validate user exists and is active
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid. User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid.",
    });
  }
};

// Check if user has required roles for access
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Verify user role is in allowed roles list
    if (!roles.includes(req.user.role)) {
      // Return 403 if unauthorized
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Optional auth that doesn't block request if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    // Try to authenticate if token exists
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      );

      const user = await User.findById(decoded.id).select("-password");
      // Attach user to request if valid
      if (user && user.isActive) {
        req.user = user;
      }
    }

    // Continue regardless of auth status (either way)
    next();
  } catch (error) {
    next();
  }
};
