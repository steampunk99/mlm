const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const withdrawalController = require('../controllers/withdrawal.controller');

// User routes
router.post('/request', isActive, withdrawalController.requestWithdrawal);
router.get('/history', isActive, withdrawalController.getWithdrawalHistory);
router.post('/:id/cancel', isActive, withdrawalController.cancelWithdrawal);

// Admin routes
router.get('/all', isAdmin, withdrawalController.getAllWithdrawals);
router.put('/:id/process', isAdmin, withdrawalController.processWithdrawal);

module.exports = router;
