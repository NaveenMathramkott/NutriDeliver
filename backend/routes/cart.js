import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyOfferToCart
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes require user authentication
router.use(authenticate);
router.use(authorize('user'));

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update/:itemId', updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/apply-offer', applyOfferToCart);

export default router;