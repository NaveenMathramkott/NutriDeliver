import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  updateNotificationPreferences
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.put('/preferences', updateNotificationPreferences);

export default router;