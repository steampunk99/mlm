const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const reportController = require('../controllers/report.controller');
const reportValidation = require('../middleware/report.validate');

// User Routes
router.get('/network', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.generateNetworkReport
);

router.get('/earnings', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.generateEarningsReport
);

router.get('/package', 
    isActive, 
    reportValidation.validateDateRange, 
    reportController.generatePackageReport
);

router.get('/history', 
    isActive, 
    reportValidation.validateHistoryFilters, 
    reportController.getReportHistory
);

// Admin Routes
router.get('/global-stats', 
    isAdmin, 
    reportController.generateGlobalStats
);

module.exports = router;
