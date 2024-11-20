const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ReportService {
    async findAll() {
        return prisma.report.findMany({
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findById(id) {
        return prisma.report.findUnique({
            where: { id },
            include: {
                user: true
            }
        });
    }

    async create(reportData) {
        return prisma.report.create({
            data: reportData,
            include: {
                user: true
            }
        });
    }

    async update(id, reportData) {
        return prisma.report.update({
            where: { id },
            data: reportData,
            include: {
                user: true
            }
        });
    }

    async delete(id) {
        return prisma.report.delete({
            where: { id }
        });
    }

    async getUserReports(userId) {
        return prisma.report.findMany({
            where: {
                userId
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async generateCommissionReport(userId, startDate, endDate) {
        const commissions = await prisma.commission.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                package: true,
                sourceUser: true
            }
        });

        const totalAmount = commissions.reduce((sum, commission) => sum + commission.amount, 0);
        const byType = commissions.reduce((acc, commission) => {
            acc[commission.type] = (acc[commission.type] || 0) + commission.amount;
            return acc;
        }, {});

        return this.create({
            userId,
            type: 'COMMISSION',
            data: {
                totalAmount,
                byType,
                startDate,
                endDate,
                commissionCount: commissions.length
            }
        });
    }

    async generateWithdrawalReport(userId, startDate, endDate) {
        const withdrawals = await prisma.withdrawal.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const totalAmount = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
        const byStatus = withdrawals.reduce((acc, withdrawal) => {
            acc[withdrawal.status] = (acc[withdrawal.status] || 0) + withdrawal.amount;
            return acc;
        }, {});

        return this.create({
            userId,
            type: 'WITHDRAWAL',
            data: {
                totalAmount,
                byStatus,
                startDate,
                endDate,
                withdrawalCount: withdrawals.length
            }
        });
    }

    async generateNetworkReport(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                node: {
                    include: {
                        sponsored: {
                            include: {
                                user: true,
                                package: {
                                    include: {
                                        package: true
                                    }
                                }
                            }
                        },
                        children: {
                            include: {
                                user: true,
                                package: {
                                    include: {
                                        package: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user || !user.node) {
            throw new Error('User or node not found');
        }

        const networkData = {
            sponsoredCount: user.node.sponsored.length,
            leftCount: user.node.children.filter(child => child.position === 'LEFT').length,
            rightCount: user.node.children.filter(child => child.position === 'RIGHT').length,
            totalPackageValue: user.node.sponsored.reduce((sum, node) => {
                return sum + (node.package?.package?.price || 0);
            }, 0)
        };

        return this.create({
            userId,
            type: 'NETWORK',
            data: networkData
        });
    }
}

module.exports = new ReportService();
