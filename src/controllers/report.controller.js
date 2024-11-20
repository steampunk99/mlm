const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const analyticsService = require('../services/analytics.service');
const notificationService = require('../services/notification.service');

class ReportController {
    async getNetworkGrowth(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, interval = 'day' } = req.query;

            const growth = await analyticsService.getNetworkGrowth({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                interval
            });

            res.json({
                success: true,
                data: growth
            });
        } catch (error) {
            console.error('Get network growth error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch network growth'
            });
        }
    }

    async getCommissionReport(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, type } = req.query;

            const report = await analyticsService.getCommissionReport({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                type
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get commission report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch commission report'
            });
        }
    }

    async getTeamPerformanceReport(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, metrics = ['sales', 'referrals', 'commissions'] } = req.query;

            const performance = await analyticsService.getTeamPerformanceReport({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                metrics: Array.isArray(metrics) ? metrics : [metrics]
            });

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            console.error('Get team performance report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch team performance report'
            });
        }
    }

    async getRankAdvancementReport(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            const report = await analyticsService.getRankAdvancementReport({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get rank advancement report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch rank advancement report'
            });
        }
    }

    async getPackageDistributionReport(req, res) {
        try {
            const userId = req.user.id;

            const distribution = await analyticsService.getPackageDistributionReport(userId);

            res.json({
                success: true,
                data: distribution
            });
        } catch (error) {
            console.error('Get package distribution report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch package distribution report'
            });
        }
    }

    async getActivityReport(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, type } = req.query;

            const activity = await analyticsService.getActivityReport({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                type
            });

            res.json({
                success: true,
                data: activity
            });
        } catch (error) {
            console.error('Get activity report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch activity report'
            });
        }
    }

    async generateCustomReport(req, res) {
        try {
            const userId = req.user.id;
            const { metrics, filters, groupBy, startDate, endDate } = req.body;

            const report = await analyticsService.generateCustomReport({
                userId,
                metrics,
                filters,
                groupBy,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            });

            // Schedule report generation notification
            await notificationService.createNotification({
                userId,
                type: 'REPORT',
                title: 'Custom Report Generated',
                message: 'Your custom report has been generated successfully',
                data: { reportId: report.id }
            });

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Generate custom report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate custom report'
            });
        }
    }

    async exportReport(req, res) {
        try {
            const userId = req.user.id;
            const { reportId, format = 'csv' } = req.query;

            const exportData = await analyticsService.exportReport({
                userId,
                reportId,
                format
            });

            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename=report.${format}`);
            res.send(exportData);
        } catch (error) {
            console.error('Export report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export report'
            });
        }
    }

    async scheduleReport(req, res) {
        try {
            const userId = req.user.id;
            const { reportConfig, schedule } = req.body;

            const scheduledReport = await analyticsService.scheduleReport({
                userId,
                reportConfig,
                schedule
            });

            res.json({
                success: true,
                data: scheduledReport,
                message: 'Report scheduled successfully'
            });
        } catch (error) {
            console.error('Schedule report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to schedule report'
            });
        }
    }
}

module.exports = new ReportController();
