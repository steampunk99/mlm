const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const packageController = require('../controllers/package.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - level
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         level:
 *           type: integer
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Get all available packages
 *     tags: [Packages]
 */
router.get('/', isActive, packageController.getAllPackages);

/**
 * @swagger
 * /packages/user:
 *   get:
 *     summary: Get user's purchased packages
 *     tags: [Packages]
 */
router.get('/user', isActive, packageController.getUserPackages);

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Create a new package (Admin only)
 *     tags: [Packages]
 */
router.post('/', [
    isAdmin,
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('level').isInt({ min: 1 }),
    body('features').optional().isArray(),
    body('isActive').optional().isBoolean(),
    validate
], packageController.createPackage);

/**
 * @swagger
 * /packages/{id}:
 *   put:
 *     summary: Update package details (Admin only)
 *     tags: [Packages]
 */
router.put('/:id', [
    isAdmin,
    param('id').isString(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('level').optional().isInt({ min: 1 }),
    body('features').optional().isArray(),
    body('isActive').optional().isBoolean(),
    validate
], packageController.updatePackage);

/**
 * @swagger
 * /packages/{id}:
 *   delete:
 *     summary: Delete package (Admin only)
 *     tags: [Packages]
 */
router.delete('/:id', [
    isAdmin,
    param('id').isString(),
    validate
], packageController.deletePackage);

/**
 * @swagger
 * /packages/upgrade:
 *   post:
 *     summary: Upgrade existing package
 *     tags: [Packages]
 */
router.post('/upgrade', [
    isActive,
    body('currentPackageId').isString(),
    body('newPackageId').isString(),
    body('paymentMethod').isIn(['MPESA', 'BANK', 'CRYPTO']),
    body('phoneNumber').optional().matches(/^\+?[1-9]\d{1,14}$/),
    validate
], packageController.upgradePackage);

/**
 * @swagger
 * /packages/upgrade/history:
 *   get:
 *     summary: Get package upgrade history
 *     tags: [Packages]
 */
router.get('/upgrade/history', [
    isActive,
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate
], packageController.getUpgradeHistory);

module.exports = router;
