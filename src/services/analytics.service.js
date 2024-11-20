const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
    // Network Analytics
    async getNetworkMetrics(startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        const [totalUsers, activeUsers, newSignups, packageUpgrades] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    lastActivityAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
                    }
                }
            }),
            prisma.user.count({
                where: {
                    ...dateFilter
                }
            }),
            prisma.packageHistory.count({
                where: {
                    type: 'UPGRADE',
                    ...dateFilter
                }
            })
        ]);

        return {
            totalUsers,
            activeUsers,
            newSignups,
            packageUpgrades,
            userRetentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
        };
    }

    // Financial Analytics
    async getFinancialMetrics(startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        const [totalRevenue, commissionsPaid, withdrawals, pendingWithdrawals] = await Promise.all([
            prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    ...dateFilter
                },
                _sum: {
                    amount: true
                }
            }),
            prisma.commission.aggregate({
                where: {
                    status: 'PAID',
                    ...dateFilter
                },
                _sum: {
                    amount: true
                }
            }),
            prisma.withdrawal.aggregate({
                where: {
                    status: 'COMPLETED',
                    ...dateFilter
                },
                _sum: {
                    amount: true
                }
            }),
            prisma.withdrawal.aggregate({
                where: {
                    status: 'PENDING',
                    ...dateFilter
                },
                _sum: {
                    amount: true
                }
            })
        ]);

        return {
            totalRevenue: totalRevenue._sum.amount || 0,
            commissionsPaid: commissionsPaid._sum.amount || 0,
            withdrawals: withdrawals._sum.amount || 0,
            pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
            profitMargin: totalRevenue._sum.amount > 0 
                ? ((totalRevenue._sum.amount - commissionsPaid._sum.amount) / totalRevenue._sum.amount) * 100 
                : 0
        };
    }

    // Package Analytics
    async getPackageMetrics(startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        const packageStats = await prisma.user.groupBy({
            by: ['packageId'],
            where: {
                packageId: {
                    not: null
                }
            },
            _count: {
                _all: true
            }
        });

        const packageHistory = await prisma.packageHistory.groupBy({
            by: ['type'],
            where: dateFilter,
            _count: {
                _all: true
            }
        });

        return {
            packageDistribution: packageStats,
            packageTransactions: packageHistory,
            totalPackageHolders: packageStats.reduce((acc, curr) => acc + curr._count._all, 0)
        };
    }

    // Commission Analytics
    async getCommissionMetrics(startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        const commissionStats = await prisma.commission.groupBy({
            by: ['type'],
            where: {
                ...dateFilter
            },
            _count: {
                _all: true
            },
            _sum: {
                amount: true
            }
        });

        const topEarners = await prisma.user.findMany({
            where: {
                commissions: {
                    some: dateFilter
                }
            },
            select: {
                id: true,
                username: true,
                _count: {
                    select: {
                        commissions: true
                    }
                },
                commissions: {
                    where: dateFilter,
                    select: {
                        amount: true
                    }
                }
            },
            orderBy: {
                commissions: {
                    _count: 'desc'
                }
            },
            take: 10
        });

        return {
            commissionStats,
            topEarners: topEarners.map(user => ({
                userId: user.id,
                username: user.username,
                totalCommissions: user.commissions.reduce((sum, comm) => sum + comm.amount, 0),
                commissionCount: user._count.commissions
            }))
        };
    }

    // User Engagement Analytics
    async getUserEngagementMetrics(startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        const [loginStats, referralStats, activityStats] = await Promise.all([
            prisma.userLogin.groupBy({
                by: ['userId'],
                where: dateFilter,
                _count: {
                    _all: true
                }
            }),
            prisma.user.groupBy({
                by: ['referrerId'],
                where: {
                    referrerId: {
                        not: null
                    },
                    ...dateFilter
                },
                _count: {
                    _all: true
                }
            }),
            prisma.userActivity.groupBy({
                by: ['type'],
                where: dateFilter,
                _count: {
                    _all: true
                }
            })
        ]);

        return {
            averageLoginsPerUser: loginStats.length > 0 
                ? loginStats.reduce((sum, stat) => sum + stat._count._all, 0) / loginStats.length 
                : 0,
            topReferrers: referralStats
                .sort((a, b) => b._count._all - a._count._all)
                .slice(0, 10),
            activityBreakdown: activityStats
        };
    }

    // Growth Analytics
    async getGrowthMetrics(periods = 12) { // Default to last 12 months
        const metrics = [];
        const now = new Date();

        for (let i = 0; i < periods; i++) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const [users, revenue, commissions] = await Promise.all([
                prisma.user.count({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }),
                prisma.payment.aggregate({
                    where: {
                        status: 'COMPLETED',
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    _sum: {
                        amount: true
                    }
                }),
                prisma.commission.aggregate({
                    where: {
                        status: 'PAID',
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    _sum: {
                        amount: true
                    }
                })
            ]);

            metrics.push({
                period: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
                newUsers: users,
                revenue: revenue._sum.amount || 0,
                commissions: commissions._sum.amount || 0
            });
        }

        return metrics.reverse(); // Return in chronological order
    }

    // Comprehensive Dashboard Analytics
    async getDashboardMetrics() {
        const [
            networkMetrics,
            financialMetrics,
            packageMetrics,
            commissionMetrics,
            engagementMetrics
        ] = await Promise.all([
            this.getNetworkMetrics(),
            this.getFinancialMetrics(),
            this.getPackageMetrics(),
            this.getCommissionMetrics(),
            this.getUserEngagementMetrics()
        ]);

        return {
            network: networkMetrics,
            financial: financialMetrics,
            packages: packageMetrics,
            commissions: commissionMetrics,
            engagement: engagementMetrics,
            timestamp: new Date()
        };
    }

    // Performance Analysis
    async analyzePerformanceMetrics(userId, startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        const [
            userDetails,
            networkSize,
            commissionHistory,
            packageHistory
        ] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    package: true
                }
            }),
            prisma.user.count({
                where: {
                    uplineId: userId
                }
            }),
            prisma.commission.findMany({
                where: {
                    userId,
                    ...dateFilter
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.packageHistory.findMany({
                where: {
                    userId,
                    ...dateFilter
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);

        const totalEarnings = commissionHistory.reduce((sum, comm) => sum + comm.amount, 0);
        const averageEarnings = commissionHistory.length > 0 ? totalEarnings / commissionHistory.length : 0;

        return {
            user: {
                id: userDetails.id,
                username: userDetails.username,
                currentPackage: userDetails.package?.name || 'None',
                joinDate: userDetails.createdAt
            },
            network: {
                size: networkSize,
                activeMembers: await this.getActiveDownlineCount(userId)
            },
            earnings: {
                total: totalEarnings,
                average: averageEarnings,
                history: commissionHistory
            },
            progression: {
                packageHistory,
                milestones: await this.getUserMilestones(userId)
            }
        };
    }

    // Helper Methods
    async getActiveDownlineCount(userId) {
        return prisma.user.count({
            where: {
                uplineId: userId,
                lastActivityAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
                }
            }
        });
    }

    async getUserMilestones(userId) {
        // Implement milestone tracking logic based on your business rules
        // Example: First commission, package upgrades, network size achievements, etc.
        return [];
    }
}

module.exports = new AnalyticsService();
