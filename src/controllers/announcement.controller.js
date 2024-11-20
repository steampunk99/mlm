const { Op } = require('sequelize');
const Announcement = require('../models/announcement.model');
const NotificationController = require('./notification.controller');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../config/socket');

class AnnouncementController {
    // Create announcement
    async createAnnouncement(req, res) {
        const {
            title,
            content,
            type,
            priority,
            startDate,
            endDate,
            targetAudience,
            attachments
        } = req.body;

        try {
            const announcement = await Announcement.create({
                title,
                content,
                type,
                priority,
                startDate,
                endDate,
                targetAudience,
                attachments,
                createdBy: req.user.id
            });

            // Emit real-time announcement
            const io = getIO();
            io.emit('announcement', announcement);

            // Create notifications for target users
            if (announcement.targetAudience !== 'ADMIN') {
                const userIds = await this.getTargetUserIds(announcement.targetAudience);
                await NotificationController.createSystemNotification(
                    userIds,
                    `New Announcement: ${title}`,
                    content,
                    { announcementId: announcement.id }
                );
            }

            res.status(201).json(announcement);
        } catch (error) {
            throw new ApiError(500, 'Error creating announcement');
        }
    }

    // Get all announcements
    async getAnnouncements(req, res) {
        const {
            page = 1,
            limit = 10,
            type,
            priority,
            startDate,
            endDate,
            isActive
        } = req.query;

        try {
            const where = {
                ...(type && { type }),
                ...(priority && { priority }),
                ...(isActive !== undefined && { isActive }),
                ...(startDate && endDate && {
                    startDate: {
                        [Op.between]: [startDate, endDate]
                    }
                })
            };

            // Add audience check based on user role
            if (!req.user.isAdmin) {
                where[Op.or] = [
                    { targetAudience: 'ALL' },
                    { targetAudience: req.user.active ? 'ACTIVE' : 'INACTIVE' }
                ];
            }

            const announcements = await Announcement.findAndCountAll({
                where,
                order: [
                    ['priority', 'DESC'],
                    ['createdAt', 'DESC']
                ],
                limit: parseInt(limit),
                offset: (page - 1) * limit
            });

            res.json({
                announcements: announcements.rows,
                total: announcements.count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(announcements.count / limit)
            });
        } catch (error) {
            throw new ApiError(500, 'Error fetching announcements');
        }
    }

    // Update announcement
    async updateAnnouncement(req, res) {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const announcement = await Announcement.findByPk(id);
            if (!announcement) {
                throw new ApiError(404, 'Announcement not found');
            }

            await announcement.update(updateData);

            // Emit update event
            const io = getIO();
            io.emit('announcementUpdate', announcement);

            res.json(announcement);
        } catch (error) {
            throw new ApiError(500, 'Error updating announcement');
        }
    }

    // Delete announcement
    async deleteAnnouncement(req, res) {
        const { id } = req.params;

        try {
            const announcement = await Announcement.findByPk(id);
            if (!announcement) {
                throw new ApiError(404, 'Announcement not found');
            }

            await announcement.destroy();

            // Emit deletion event
            const io = getIO();
            io.emit('announcementDelete', { id });

            res.json({ message: 'Announcement deleted successfully' });
        } catch (error) {
            throw new ApiError(500, 'Error deleting announcement');
        }
    }

    // Get active announcements
    async getActiveAnnouncements(req, res) {
        try {
            const announcements = await Announcement.findAll({
                where: {
                    isActive: true,
                    startDate: {
                        [Op.lte]: new Date()
                    },
                    [Op.or]: [
                        { endDate: null },
                        { endDate: { [Op.gte]: new Date() } }
                    ],
                    [Op.or]: [
                        { targetAudience: 'ALL' },
                        { targetAudience: req.user.active ? 'ACTIVE' : 'INACTIVE' }
                    ]
                },
                order: [
                    ['priority', 'DESC'],
                    ['createdAt', 'DESC']
                ]
            });

            res.json(announcements);
        } catch (error) {
            throw new ApiError(500, 'Error fetching active announcements');
        }
    }

    // Helper method to get target user IDs
    async getTargetUserIds(targetAudience) {
        const where = {};
        switch (targetAudience) {
            case 'ACTIVE':
                where.active = true;
                break;
            case 'INACTIVE':
                where.active = false;
                break;
        }

        const users = await User.findAll({
            where,
            attributes: ['id']
        });

        return users.map(user => user.id);
    }
}

module.exports = new AnnouncementController();
