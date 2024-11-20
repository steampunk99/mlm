const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { isActive } = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

// Process package payment
router.post('/process', [
    body('package_id').isInt().notEmpty(),
    body('payment_method').isIn(['bank_transfer', 'mobile_money', 'card']).notEmpty(),
    body('payment_reference').trim().notEmpty(),
    validate,
    isActive
], paymentController.processPackagePayment);

// Get payment history
router.get('/history', isActive, paymentController.getPaymentHistory);

module.exports = router;
