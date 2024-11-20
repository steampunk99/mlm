const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(isAdmin);

// User management routes
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', [
    body('status').isIn(['active', 'inactive', 'suspended']),
    validate
], adminController.updateUserStatus);

// Package management routes
router.post('/packages', [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').isNumeric(),
    body('level').isInt({ min: 1 }),
    validate
], adminController.createPackage);

router.put('/packages/:id', [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').isNumeric(),
    body('level').isInt({ min: 1 }),
    validate
], adminController.updatePackage);

router.delete('/packages/:id', adminController.deletePackage);

// Withdrawal management routes
router.patch('/withdrawals/:id', [
    body('status').isIn(['approved', 'rejected']),
    body('reason').optional().trim(),
    validate
], adminController.processWithdrawal);

// Statistics route
router.get('/statistics', adminController.getStatistics);

module.exports = router;
