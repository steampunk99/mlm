const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const announcementService = require('../services/announcement.service');
const notificationService = require('../services/notification.service');

class AnnouncementController {
    async createAnnouncement(req, res) {
        try {
            const { title, content, type, priority, expiryDate, audience } = req.body;
            const authorId = req.user.id;

            const announcement = await announcementService.create({
                title,
                content,
                type,
                priority,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                audience,
                authorId
            });

            // Notify relevant users based on audience
            if (announcement.audience === 'ALL') {
                const users = await prisma.user.findMany({
                    where: { active: true }
                });
                for (const user of users) {
                    await notificationService.create({
                        userId: user.id,
                        title: `New Announcement: ${announcement.title}`,
                        message: announcement.content.substring(0, 100) + '...',
                        type: 'ANNOUNCEMENT',
                        priority: announcement.priority,
                        metadata: { announcementId: announcement.id }
                    });
                }
            }

            res.status(201).json({
                success: true,
                data: announcement
            });
        } catch (error) {
            console.error('Create announcement error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create announcement'
            });
        }
    }

    async getAnnouncements(req, res) {
        try {
            const { type, priority, startDate, endDate, page = 1, limit = 10 } = req.query;

            const announcements = await announcementService.findAll({
                type,
                priority,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                page: parseInt(page),
                limit: parseInt(limit),
                audience: req.user.isAdmin ? undefined : ['ALL', req.user.role]
            });

            res.json({
                success: true,
                data: announcements
            });
        } catch (error) {
            console.error('Get announcements error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch announcements'
            });
        }
    }

    async getAnnouncementById(req, res) {
        try {
            const { id } = req.params;
            const announcement = await announcementService.findById(id);

            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    error: 'Announcement not found'
                });
            }

            // Check if user has access to this announcement
            if (!req.user.isAdmin && 
                announcement.audience !== 'ALL' && 
                announcement.audience !== req.user.role) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view this announcement'
                });
            }

            // Update view count
            await announcementService.incrementViews(id);

            res.json({
                success: true,
                data: announcement
            });
        } catch (error) {
            console.error('Get announcement by ID error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch announcement'
            });
        }
    }

    async updateAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to update announcements'
                });
            }

            const announcement = await announcementService.findById(id);
            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    error: 'Announcement not found'
                });
            }

            const updatedAnnouncement = await announcementService.update(id, {
                ...updates,
                expiryDate: updates.expiryDate ? new Date(updates.expiryDate) : announcement.expiryDate
            });

            res.json({
                success: true,
                data: updatedAnnouncement
            });
        } catch (error) {
            console.error('Update announcement error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update announcement'
            });
        }
    }

    async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;

            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to delete announcements'
                });
            }

            const announcement = await announcementService.findById(id);
            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    error: 'Announcement not found'
                });
            }

            await announcementService.delete(id);

            res.json({
                success: true,
                message: 'Announcement deleted successfully'
            });
        } catch (error) {
            console.error('Delete announcement error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete announcement'
            });
        }
    }

    async getAnnouncementStats(req, res) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to view announcement statistics'
                });
            }

            const stats = await announcementService.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get announcement stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch announcement statistics'
            });
        }
    }
}

module.exports = new AnnouncementController();
