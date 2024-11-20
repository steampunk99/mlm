const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const withdrawalController = require('../controllers/withdrawal.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Withdrawal:
 *       type: object
 *       required:
 *         - amount
 *         - withdrawal_method
 *       properties:
 *         amount:
 *           type: number
 *         withdrawal_method:
 *           type: string
 *           enum: [MPESA, BANK, CRYPTO]
 *         paymentDetails:
 *           type: object
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *         remarks:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         processedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     summary: Request a new withdrawal
 *     tags: [Withdrawals]
 */
router.post('/', [
    isActive,
    body('amount').isFloat({ min: 0 }),
    body('withdrawal_method').isIn(['MPESA', 'BANK', 'CRYPTO']),
    body('paymentDetails').isObject(),
    validate
], withdrawalController.requestWithdrawal);

/**
 * @swagger
 * /withdrawals:
 *   get:
 *     summary: Get user's withdrawal history
 *     tags: [Withdrawals]
 */
router.get('/', [
    isActive,
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    query('withdrawal_method').optional().isIn(['MPESA', 'BANK', 'CRYPTO']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('min_amount').optional().isFloat({ min: 0 }),
    query('max_amount').optional().isFloat({ min: 0 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
], withdrawalController.getWithdrawalHistory);

/**
 * @swagger
 * /withdrawals/{id}/cancel:
 *   post:
 *     summary: Cancel a pending withdrawal request
 *     tags: [Withdrawals]
 */
router.post('/:id/cancel', [
    isActive,
    param('id').isString(),
    validate
], withdrawalController.cancelWithdrawal);

/**
 * @swagger
 * /withdrawals/{id}/process:
 *   post:
 *     summary: Process withdrawal request (Admin only)
 *     tags: [Withdrawals]
 */
router.post('/:id/process', [
    isAdmin,
    param('id').isString(),
    body('status').isIn(['COMPLETED', 'FAILED']),
    body('remarks').optional().isString(),
    body('transaction_hash').optional().isString(),
    validate
], withdrawalController.processWithdrawal);

/**
 * @swagger
 * /withdrawals/all:
 *   get:
 *     summary: Get all withdrawals (Admin only)
 *     tags: [Withdrawals]
 */
router.get('/all', [
    isAdmin,
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    query('withdrawal_method').optional().isIn(['MPESA', 'BANK', 'CRYPTO']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('min_amount').optional().isFloat({ min: 0 }),
    query('max_amount').optional().isFloat({ min: 0 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
], withdrawalController.getAllWithdrawals);

module.exports = router;
