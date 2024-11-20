const express = require('express');
const router = express.Router();
const { isActive } = require('../middleware/auth');
const { query } = require('express-validator');
const { validate } = require('../middleware/validate');
const financeController = require('../controllers/finance.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Balance:
 *       type: object
 *       properties:
 *         currentBalance:
 *           type: number
 *         totalCredits:
 *           type: number
 *         totalDebits:
 *           type: number
 *     Statement:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *           enum: [CREDIT, DEBIT]
 *         description:
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
 * /finance/balance:
 *   get:
 *     summary: Get user's current balance
 *     tags: [Finance]
 */
router.get('/balance', isActive, financeController.getBalance);

/**
 * @swagger
 * /finance/statement:
 *   get:
 *     summary: Get user's statement/transactions
 *     tags: [Finance]
 */
router.get('/statement', [
    isActive,
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['CREDIT', 'DEBIT']),
    validate
], financeController.getStatement);

/**
 * @swagger
 * /finance/withdrawals:
 *   get:
 *     summary: Get user's withdrawal history
 *     tags: [Finance]
 */
router.get('/withdrawals', [
    isActive,
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    validate
], financeController.getWithdrawals);

/**
 * @swagger
 * /finance/commissions:
 *   post:
 *     summary: Calculate and distribute commissions
 *     tags: [Finance]
 */
router.post('/commissions', [
    isActive,
    validate
], financeController.distributeCommissions);

module.exports = router;
