const { Op } = require('sequelize');
const Report = require('../models/report.model');
const User = require('../models/user.model');
const Package = require('../models/package.model');
const Withdrawal = require('../models/withdrawal.model');
const Commission = require('../models/commission.model');
const { sequelize } = require('../config/database');
const ApiError = require('../utils/ApiError');

class ReportController {
    // Generate Network Growth Report
    async generateNetworkReport(req, res) {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        try {
            const networkMetrics = await User.findAll({
                where: {
                    sponsorId: userId,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'newMembers'],
                    [sequelize.fn('SUM', sequelize.col('activePackage')), 'packageValue']
                ],
                group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
            });

            const report = await Report.create({
                userId,
                reportType: 'NETWORK',
                startDate,
                endDate,
                metrics: {
                    dailyGrowth: networkMetrics,
                    totalNewMembers: networkMetrics.reduce((sum, day) => sum + day.newMembers, 0),
                    totalPackageValue: networkMetrics.reduce((sum, day) => sum + day.packageValue, 0)
                },
                status: 'GENERATED',
                generatedAt: new Date()
            });

            res.json(report);
        } catch (error) {
            throw new ApiError(500, 'Error generating network report');
        }
    }

    // Generate Earnings Report
    async generateEarningsReport(req, res) {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        try {
            const commissionMetrics = await Commission.findAll({
                where: {
                    userId,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                attributes: [
                    'type',
                    [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['type']
            });

            const withdrawalMetrics = await Withdrawal.findAll({
                where: {
                    userId,
                    status: 'COMPLETED',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                attributes: [
                    'method',
                    [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['method']
            });

            const report = await Report.create({
                userId,
                reportType: 'EARNINGS',
                startDate,
                endDate,
                metrics: {
                    commissions: commissionMetrics,
                    withdrawals: withdrawalMetrics,
                    totalEarnings: commissionMetrics.reduce((sum, type) => sum + type.totalAmount, 0),
                    totalWithdrawals: withdrawalMetrics.reduce((sum, method) => sum + method.totalAmount, 0)
                },
                status: 'GENERATED',
                generatedAt: new Date()
            });

            res.json(report);
        } catch (error) {
            throw new ApiError(500, 'Error generating earnings report');
        }
    }

    // Generate Package Performance Report
    async generatePackageReport(req, res) {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        try {
            const packageMetrics = await Package.findAll({
                include: [{
                    model: User,
                    where: {
                        sponsorId: userId
                    },
                    attributes: []
                }],
                attributes: [
                    'name',
                    'price',
                    [sequelize.fn('COUNT', sequelize.col('Users.id')), 'totalUsers'],
                    [sequelize.literal('price * COUNT(Users.id)'), 'totalValue']
                ],
                group: ['Package.id']
            });

            const report = await Report.create({
                userId,
                reportType: 'PACKAGE',
                startDate,
                endDate,
                metrics: {
                    packages: packageMetrics,
                    totalPackages: packageMetrics.reduce((sum, pkg) => sum + pkg.totalUsers, 0),
                    totalValue: packageMetrics.reduce((sum, pkg) => sum + pkg.totalValue, 0)
                },
                status: 'GENERATED',
                generatedAt: new Date()
            });

            res.json(report);
        } catch (error) {
            throw new ApiError(500, 'Error generating package report');
        }
    }

    // Get Report History
    async getReportHistory(req, res) {
        const { type, startDate, endDate } = req.query;
        const userId = req.user.id;

        try {
            const where = {
                userId,
                ...(type && { reportType: type }),
                ...(startDate && endDate && {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                })
            };

            const reports = await Report.findAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            res.json(reports);
        } catch (error) {
            throw new ApiError(500, 'Error fetching report history');
        }
    }

    // Admin: Generate Global Statistics
    async generateGlobalStats(req, res) {
        try {
            const userStats = await User.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
                    [sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance'],
                    [sequelize.fn('COUNT', sequelize.literal('CASE WHEN active = true THEN 1 END')), 'activeUsers']
                ]
            });

            const packageStats = await Package.findAll({
                attributes: [
                    'name',
                    [sequelize.fn('COUNT', sequelize.col('Users.id')), 'userCount'],
                    [sequelize.literal('price * COUNT(Users.id)'), 'totalValue']
                ],
                include: [{
                    model: User,
                    attributes: []
                }],
                group: ['Package.id']
            });

            const withdrawalStats = await Withdrawal.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
                ],
                group: ['status']
            });

            const report = await Report.create({
                userId: req.user.id,
                reportType: 'GLOBAL',
                startDate: new Date(),
                endDate: new Date(),
                metrics: {
                    userStats,
                    packageStats,
                    withdrawalStats
                },
                status: 'GENERATED',
                generatedAt: new Date()
            });

            res.json(report);
        } catch (error) {
            throw new ApiError(500, 'Error generating global statistics');
        }
    }
}

module.exports = new ReportController();
