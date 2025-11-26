import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimit.js';
import {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getPaymentHistory
} from '../controllers/paymentController.js';

const router = express.Router();

// All payment routes require authentication and rate limiting
router.use(authenticate);
router.use(paymentLimiter);

// User payment routes
router.post('/create-intent', authorize('user'), createPaymentIntent);
router.post('/confirm', authorize('user'), confirmPayment);
router.get('/methods', authorize('user'), getPaymentMethods);
router.post('/methods', authorize('user'), addPaymentMethod);
router.delete('/methods/:methodId', authorize('user'), removePaymentMethod);
router.get('/history', authorize('user'), getPaymentHistory);

// Admin/restaurant refund routes
router.post('/refund', authorize('admin', 'restaurant'), processRefund);

export default router;