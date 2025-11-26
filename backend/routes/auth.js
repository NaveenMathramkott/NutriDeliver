import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateRegister, validateLogin } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validate(validateRegister), register);
router.post('/login', authLimiter, validate(validateLogin), login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/verify-email', authLimiter, verifyEmail);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getCurrentUser);

export default router;