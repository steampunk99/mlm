const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const packageController = require('../controllers/package.controller');

// Public routes
router.get('/', packageController.getAllPackages);

// User routes (requires authentication)
router.get('/user', isActive, packageController.getUserPackages);
router.post('/purchase', isActive, packageController.purchasePackage);
router.post('/upgrade', isActive, packageController.upgradePackage);
router.get('/upgrade-history', isActive, packageController.getUpgradeHistory);

// Admin routes
router.post('/', isAdmin, packageController.createPackage);
router.put('/:id', isAdmin, packageController.updatePackage);
router.delete('/:id', isAdmin, packageController.deletePackage);

module.exports = router;
