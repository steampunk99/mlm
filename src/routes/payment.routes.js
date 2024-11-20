const express = require('express');
const router = express.Router();
const { isActive } = require('../middleware/auth');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const paymentController = require('../controllers/payment.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - paymentMethod
 *         - paymentReference
 *       properties:
 *         amount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [MPESA, BANK, CRYPTO]
 *         paymentReference:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /payments/package:
 *   post:
 *     summary: Process package purchase payment
 *     tags: [Payments]
 */
router.post('/package', [
    isActive,
    body('packageId').isString(),
    body('paymentMethod').isIn(['MPESA', 'BANK', 'CRYPTO']),
    body('paymentReference').isString(),
    validate
], paymentController.processPackagePayment);

/**
 * @swagger
 * /payments/upgrade:
 *   post:
 *     summary: Process package upgrade payment
 *     tags: [Payments]
 */
router.post('/upgrade', [
    isActive,
    body('currentPackageId').isString(),
    body('newPackageId').isString(),
    body('paymentMethod').isIn(['MPESA', 'BANK', 'CRYPTO']),
    body('paymentReference').isString(),
    validate
], paymentController.processUpgradePayment);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 */
router.get('/history', [
    isActive,
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['PACKAGE', 'UPGRADE']),
    validate
], paymentController.getPaymentHistory);

module.exports = router;
