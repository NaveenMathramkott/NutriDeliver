import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  
  const query = { userId: req.user.id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false
  });

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false
  });

  res.json({
    success: true,
    data: {
      unreadCount
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user.id
    },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notification
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );

  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false
  });

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      unreadCount
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, push, sms } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      notificationPreferences: {
        email: email || req.user.notificationPreferences?.email,
        push: push || req.user.notificationPreferences?.push,
        sms: sms || req.user.notificationPreferences?.sms
      }
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      user
    }
  });
});

// Helper function to create notifications
export const createNotification = async (userId, title, message, type, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to create multiple notifications
export const createNotifications = async (userIds, title, message, type, data = {}) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
      data
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating multiple notifications:', error);
  }
};