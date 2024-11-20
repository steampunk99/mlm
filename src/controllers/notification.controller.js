const { Op } = require('sequelize');
const Notification = require('../models/notification.model');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../config/socket');

class NotificationController {
    // Create a new notification
    async createNotification(userId, type, title, message, data = {}, priority = 'LOW') {
        try {
            const notification = await Notification.create({
                userId,
                type,
                title,
                message,
                data,
                priority
            });

            // Emit real-time notification
            const io = getIO();
            io.to(`user_${userId}`).emit('notification', notification);

            return notification;
        } catch (error) {
            throw new ApiError(500, 'Error creating notification');
        }
    }

    // Get user notifications
    async getUserNotifications(req, res) {
        const { 
            page = 1, 
            limit = 10, 
            type, 
            isRead,
            startDate,
            endDate 
        } = req.query;
        const userId = req.user.id;

        try {
            const where = {
                userId,
                ...(type && { type }),
                ...(isRead !== undefined && { isRead }),
                ...(startDate && endDate && {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                })
            };

            const notifications = await Notification.findAndCountAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: (page - 1) * limit
            });

            res.json({
                notifications: notifications.rows,
                total: notifications.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(notifications.count / limit)
            });
        } catch (error) {
            throw new ApiError(500, 'Error fetching notifications');
        }
    }

    // Mark notifications as read
    async markAsRead(req, res) {
        const { notificationIds } = req.body;
        const userId = req.user.id;

        try {
            await Notification.update(
                { isRead: true },
                {
                    where: {
                        id: notificationIds,
                        userId
                    }
                }
            );

            res.json({ message: 'Notifications marked as read' });
        } catch (error) {
            throw new ApiError(500, 'Error updating notifications');
        }
    }

    // Delete notifications
    async deleteNotifications(req, res) {
        const { notificationIds } = req.body;
        const userId = req.user.id;

        try {
            await Notification.destroy({
                where: {
                    id: notificationIds,
                    userId
                }
            });

            res.json({ message: 'Notifications deleted successfully' });
        } catch (error) {
            throw new ApiError(500, 'Error deleting notifications');
        }
    }

    // Get unread count
    async getUnreadCount(req, res) {
        const userId = req.user.id;

        try {
            const count = await Notification.count({
                where: {
                    userId,
                    isRead: false
                }
            });

            res.json({ unreadCount: count });
        } catch (error) {
            throw new ApiError(500, 'Error fetching unread count');
        }
    }

    // Create system notification (for internal use)
    async createSystemNotification(userIds, title, message, data = {}) {
        try {
            const notifications = await Promise.all(
                userIds.map(userId =>
                    this.createNotification(
                        userId,
                        'SYSTEM',
                        title,
                        message,
                        data,
                        'MEDIUM'
                    )
                )
            );

            return notifications;
        } catch (error) {
            throw new ApiError(500, 'Error creating system notifications');
        }
    }
}

module.exports = new NotificationController();
