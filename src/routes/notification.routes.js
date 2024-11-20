const express = require('express');
const router = express.Router();
const { isActive } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

// Get user notifications with filtering and pagination
router.get('/', isActive, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', isActive, notificationController.getUnreadCount);

// Mark notifications as read
router.put('/mark-read', isActive, notificationController.markAsRead);

// Delete notifications
router.delete('/', isActive, notificationController.deleteNotifications);

module.exports = router;
