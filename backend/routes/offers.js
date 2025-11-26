import express from 'express';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import {
  getActiveOffers,
  validateOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  getAllOffers,
  getOfferById
} from '../controllers/offerController.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getActiveOffers);
router.get('/:id', getOfferById);

// User routes
router.post('/validate', authenticate, authorize('user'), validateOffer);

// Admin routes
router.use(authenticate);
router.use(authorize('admin'));

router.get('/admin/all', getAllOffers);
router.post('/', createOffer);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);

export default router;