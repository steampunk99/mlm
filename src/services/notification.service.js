const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationService {
    async findAll(userId, filters = {}) {
        const { startDate, endDate, type, isRead, priority } = filters;
        const where = { userId };

        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        if (type) {
            where.type = type;
        }

        if (isRead !== undefined) {
            where.isRead = isRead;
        }

        if (priority) {
            where.priority = priority;
        }

        return prisma.notification.findMany({
            where,
            include: {
                user: true,
                relatedUser: true,
                referenceData: true
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
    }

    async findById(id) {
        return prisma.notification.findUnique({
            where: { id },
            include: {
                user: true,
                relatedUser: true,
                referenceData: true
            }
        });
    }

    async create(notificationData, tx = prisma) {
        const data = {
            ...notificationData,
            createdAt: new Date(),
            isRead: false
        };

        return tx.notification.create({
            data,
            include: {
                user: true,
                relatedUser: true,
                referenceData: true
            }
        });
    }

    async markAsRead(id, tx = prisma) {
        return tx.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date()
            },
            include: {
                user: true,
                relatedUser: true,
                referenceData: true
            }
        });
    }

    async markAllAsRead(userId, tx = prisma) {
        return tx.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

    async delete(id, tx = prisma) {
        return tx.notification.delete({
            where: { id }
        });
    }

    async deleteOldNotifications(days = 30, tx = prisma) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return tx.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                },
                isRead: true
            }
        });
    }

    async getUnreadCount(userId) {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
    }

    // System Notifications
    async createSystemNotification(userId, title, message, priority = 'NORMAL', tx = prisma) {
        return this.create({
            userId,
            title,
            message,
            type: 'SYSTEM',
            priority
        }, tx);
    }

    // Financial Notifications
    async createWithdrawalNotification(userId, withdrawalId, status, amount, tx = prisma) {
        const title = `Withdrawal ${status.toLowerCase()}`;
        let message = `Your withdrawal request of $${amount} has been ${status.toLowerCase()}.`;
        let priority = 'NORMAL';

        if (status === 'COMPLETED') {
            message += ' The funds have been transferred to your account.';
        } else if (status === 'REJECTED') {
            message += ' Please contact support for more information.';
            priority = 'HIGH';
        }
        
        return this.create({
            userId,
            title,
            message,
            type: 'WITHDRAWAL',
            priority,
            metadata: { 
                withdrawalId,
                amount,
                status
            }
        }, tx);
    }

    async createCommissionNotification(userId, commissionId, amount, type, tx = prisma) {
        const title = 'New Commission Earned';
        const message = `You have earned a new ${type.toLowerCase()} commission of $${amount}`;
        
        return this.create({
            userId,
            title,
            message,
            type: 'COMMISSION',
            priority: 'HIGH',
            metadata: { 
                commissionId,
                amount,
                commissionType: type
            }
        }, tx);
    }

    // Network Notifications
    async createNetworkNotification(userId, childId, event, metadata = {}, tx = prisma) {
        let title, message, priority = 'NORMAL';

        switch (event) {
            case 'NEW_SIGNUP':
                title = 'New Member Joined';
                message = 'A new member has joined your network.';
                break;
            case 'PACKAGE_UPGRADE':
                title = 'Network Package Upgrade';
                message = 'A member in your network has upgraded their package.';
                priority = 'HIGH';
                break;
            case 'ACHIEVEMENT':
                title = 'Network Achievement';
                message = 'A member in your network has reached a new milestone.';
                priority = 'HIGH';
                break;
            default:
                title = 'Network Update';
                message = 'There has been an update in your network.';
        }

        return this.create({
            userId,
            title,
            message,
            type: 'NETWORK',
            priority,
            relatedUserId: childId,
            metadata: {
                event,
                ...metadata
            }
        }, tx);
    }

    // Package Notifications
    async createPackageNotification(userId, packageId, event, metadata = {}, tx = prisma) {
        let title, message, priority = 'NORMAL';

        switch (event) {
            case 'PURCHASE':
                title = 'Package Purchased';
                message = 'Your package purchase has been confirmed.';
                break;
            case 'UPGRADE':
                title = 'Package Upgraded';
                message = 'Your package has been successfully upgraded.';
                priority = 'HIGH';
                break;
            case 'EXPIRING':
                title = 'Package Expiring Soon';
                message = 'Your package will expire soon. Please renew to maintain your benefits.';
                priority = 'HIGH';
                break;
            default:
                title = 'Package Update';
                message = 'There has been an update to your package.';
        }

        return this.create({
            userId,
            title,
            message,
            type: 'PACKAGE',
            priority,
            metadata: {
                event,
                packageId,
                ...metadata
            }
        }, tx);
    }

    // Promotional Notifications
    async createPromotionalNotification(userId, promotionId, title, message, tx = prisma) {
        return this.create({
            userId,
            title,
            message,
            type: 'PROMOTION',
            priority: 'LOW',
            metadata: { promotionId }
        }, tx);
    }

    async getNotificationStats(userId) {
        const [unread, total, highPriority] = await Promise.all([
            prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            }),
            prisma.notification.count({
                where: { userId }
            }),
            prisma.notification.count({
                where: {
                    userId,
                    isRead: false,
                    priority: 'HIGH'
                }
            })
        ]);

        return {
            unread,
            total,
            highPriority,
            readPercentage: total > 0 ? ((total - unread) / total) * 100 : 0
        };
    }
}

module.exports = new NotificationService();
