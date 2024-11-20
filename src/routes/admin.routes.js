const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const { query, body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const adminController = require('../controllers/admin.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminStats:
 *       type: object
 *       properties:
 *         users:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             active:
 *               type: integer
 *         nodes:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             active:
 *               type: integer
 *         packages:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             active:
 *               type: integer
 *         pendingWithdrawals:
 *           type: integer
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users with pagination and filters
 *     tags: [Admin]
 */
router.get('/users', [
    isAdmin,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    query('search').optional().isString(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate
], adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Admin]
 */
router.get('/users/:id', [
    isAdmin,
    param('id').isString(),
    validate
], adminController.getUserDetails);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: Update user status
 *     tags: [Admin]
 */
router.put('/users/:id/status', [
    isAdmin,
    param('id').isString(),
    body('status').isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    validate
], adminController.updateUserStatus);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Admin]
 */
router.delete('/users/:id', [
    isAdmin,
    param('id').isString(),
    validate
], adminController.deleteUser);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 */
router.get('/stats', isAdmin, adminController.getSystemStats);

/**
 * @swagger
 * /admin/packages:
 *   post:
 *     summary: Create new package
 *     tags: [Admin]
 */
router.post('/packages', [
    isAdmin,
    body('name').isString().trim().notEmpty(),
    body('description').optional().isString(),
    body('price').isFloat({ min: 0 }),
    body('businessVolume').isFloat({ min: 0 }),
    body('level').isInt({ min: 1 }),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']),
    validate
], adminController.createPackage);

/**
 * @swagger
 * /admin/packages/{id}:
 *   put:
 *     summary: Update package
 *     tags: [Admin]
 */
router.put('/packages/:id', [
    isAdmin,
    param('id').isString(),
    body('name').optional().isString().trim(),
    body('description').optional().isString(),
    body('price').optional().isFloat({ min: 0 }),
    body('businessVolume').optional().isFloat({ min: 0 }),
    body('level').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']),
    validate
], adminController.updatePackage);

/**
 * @swagger
 * /admin/packages/{id}:
 *   delete:
 *     summary: Delete package
 *     tags: [Admin]
 */
router.delete('/packages/:id', [
    isAdmin,
    param('id').isString(),
    validate
], adminController.deletePackage);

/**
 * @swagger
 * /admin/withdrawals/{id}/process:
 *   post:
 *     summary: Process withdrawal request
 *     tags: [Admin]
 */
router.post('/withdrawals/:id/process', [
    isAdmin,
    param('id').isString(),
    body('status').isIn(['approved', 'rejected']),
    body('reason').optional().isString(),
    validate
], adminController.processWithdrawal);

module.exports = router;
