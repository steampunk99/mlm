const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const reportController = require('../controllers/report.controller');
const reportValidation = require('../middleware/report.validate');

// Network growth analysis
router.get('/network-growth', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.getNetworkGrowth
);

// Commission reports
router.get('/commissions', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.getCommissionReport
);

// Team performance metrics
router.get('/team-performance', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.getTeamPerformanceReport
);

// Rank advancement tracking
router.get('/rank-advancement', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.getRankAdvancementReport
);

// Package distribution analysis
router.get('/package-distribution', 
    isActive, 
    reportController.getPackageDistributionReport
);

// Activity reporting
router.get('/activity', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.getActivityReport
);

// Custom report generation
router.post('/custom', 
    isActive, 
    reportValidation.validateCustomReport, 
    reportController.generateCustomReport
);

// Export report
router.get('/export/:reportId', 
    isActive, 
    reportController.exportReport
);

// Schedule report
router.post('/schedule', 
    isActive, 
    reportValidation.validateSchedule, 
    reportController.scheduleReport
);

module.exports = router;
