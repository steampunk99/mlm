const express = require('express');
const router = express.Router();
const { isActive } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

// Get notifications with filtering and pagination
router.get('/', isActive, notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', isActive, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', isActive, notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', isActive, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', isActive, notificationController.deleteNotification);

// Get notification preferences
router.get('/preferences', isActive, notificationController.getNotificationPreferences);

// Update notification preferences
router.put('/preferences', isActive, notificationController.updateNotificationPreferences);

module.exports = router;
