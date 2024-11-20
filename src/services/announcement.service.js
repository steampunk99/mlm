const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnnouncementService {
    async findAll(filters = {}) {
        const { startDate, endDate, type, priority, status } = filters;
        const where = {};

        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        if (type) {
            where.type = type;
        }

        if (priority) {
            where.priority = priority;
        }

        if (status) {
            where.status = status;
        }

        return prisma.announcement.findMany({
            where,
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.announcement.findUnique({
            where: { id },
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async create(announcementData, tx = prisma) {
        const data = {
            ...announcementData,
            status: announcementData.status || 'ACTIVE',
            createdAt: new Date(),
            expiresAt: announcementData.expiresAt || this.calculateExpiryDate(announcementData.type)
        };

        return tx.announcement.create({
            data,
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async update(id, announcementData, tx = prisma) {
        return tx.announcement.update({
            where: { id },
            data: {
                ...announcementData,
                updatedAt: new Date()
            },
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async delete(id, tx = prisma) {
        return tx.announcement.delete({
            where: { id }
        });
    }

    async getActiveAnnouncements(filters = {}) {
        const { type, priority, audience } = filters;
        const where = {
            status: 'ACTIVE',
            expiresAt: {
                gt: new Date()
            }
        };

        if (type) {
            where.type = type;
        }

        if (priority) {
            where.priority = priority;
        }

        if (audience) {
            where.targetAudience = {
                some: {
                    id: audience
                }
            };
        }

        return prisma.announcement.findMany({
            where,
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
    }

    async getLatestAnnouncements(limit = 5, audience = null) {
        const where = {
            status: 'ACTIVE',
            expiresAt: {
                gt: new Date()
            }
        };

        if (audience) {
            where.targetAudience = {
                some: {
                    id: audience
                }
            };
        }

        return prisma.announcement.findMany({
            where,
            take: limit,
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async getAnnouncementsByType(type, filters = {}) {
        const { status, priority, audience } = filters;
        const where = { type };

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        if (audience) {
            where.targetAudience = {
                some: {
                    id: audience
                }
            };
        }

        return prisma.announcement.findMany({
            where,
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
    }

    async updateStatus(id, status, reason = null, tx = prisma) {
        const data = {
            status,
            ...(reason && { statusReason: reason }),
            updatedAt: new Date()
        };

        return tx.announcement.update({
            where: { id },
            data,
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async addAttachment(id, attachmentData, tx = prisma) {
        return tx.announcement.update({
            where: { id },
            data: {
                attachments: {
                    create: {
                        ...attachmentData,
                        uploadedAt: new Date()
                    }
                }
            },
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async removeAttachment(announcementId, attachmentId, tx = prisma) {
        return tx.announcement.update({
            where: { id: announcementId },
            data: {
                attachments: {
                    delete: {
                        id: attachmentId
                    }
                }
            },
            include: {
                createdBy: true,
                targetAudience: true,
                attachments: true
            }
        });
    }

    async getAnnouncementStats() {
        const [active, expired, scheduled] = await Promise.all([
            prisma.announcement.count({
                where: {
                    status: 'ACTIVE',
                    expiresAt: {
                        gt: new Date()
                    }
                }
            }),
            prisma.announcement.count({
                where: {
                    OR: [
                        { status: 'EXPIRED' },
                        {
                            status: 'ACTIVE',
                            expiresAt: {
                                lte: new Date()
                            }
                        }
                    ]
                }
            }),
            prisma.announcement.count({
                where: {
                    status: 'SCHEDULED',
                    publishAt: {
                        gt: new Date()
                    }
                }
            })
        ]);

        return {
            active,
            expired,
            scheduled
        };
    }

    calculateExpiryDate(type) {
        const now = new Date();
        switch (type) {
            case 'URGENT':
                return new Date(now.setDate(now.getDate() + 1)); // 1 day
            case 'PROMOTION':
                return new Date(now.setDate(now.getDate() + 7)); // 1 week
            case 'NEWS':
                return new Date(now.setDate(now.getDate() + 30)); // 30 days
            case 'GENERAL':
                return new Date(now.setDate(now.getDate() + 90)); // 90 days
            default:
                return new Date(now.setDate(now.getDate() + 30)); // Default 30 days
        }
    }
}

module.exports = new AnnouncementService();
