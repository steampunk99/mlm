const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const packageController = require('../controllers/package.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *         - benefits
 *       properties:
 *         id:
 *           type: integer
 *           description: Package ID
 *         name:
 *           type: string
 *           description: Package name
 *         price:
 *           type: number
 *           format: float
 *           description: Package price in USD
 *         description:
 *           type: string
 *           description: Detailed package description
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           description: List of package benefits
 *         max_referral_bonus:
 *           type: number
 *           format: float
 *           description: Maximum referral bonus percentage
 *         binary_bonus:
 *           type: number
 *           format: float
 *           description: Binary bonus percentage
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     UserPackage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         package_id:
 *           type: integer
 *         purchase_date:
 *           type: string
 *           format: date-time
 *         expiry_date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [active, expired, cancelled]
 *         transaction_id:
 *           type: string
 */

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Get all available packages
 *     description: Retrieves list of all active investment packages
 *     tags: [Packages]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter packages by status
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Package'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', packageController.getAllPackages);

/**
 * @swagger
 * /packages/{id}:
 *   get:
 *     summary: Get package details
 *     description: Retrieves detailed information about a specific package
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Package'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', packageController.getPackageById);

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Create new package
 *     description: Creates a new investment package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - description
 *               - benefits
 *               - max_referral_bonus
 *               - binary_bonus
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               max_referral_bonus:
 *                 type: number
 *                 format: float
 *               binary_bonus:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Package'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 */
router.post('/', [auth, isAdmin], packageController.createPackage);

/**
 * @swagger
 * /packages/{id}:
 *   put:
 *     summary: Update package
 *     description: Updates an existing package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               max_referral_bonus:
 *                 type: number
 *                 format: float
 *               binary_bonus:
 *                 type: number
 *                 format: float
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Package updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Package'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', [auth, isAdmin], packageController.updatePackage);

/**
 * @swagger
 * /packages/{id}:
 *   delete:
 *     summary: Delete package
 *     description: Deletes an existing package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', [auth, isAdmin], packageController.deletePackage);

/**
 * @swagger
 * /packages/purchase/{id}:
 *   post:
 *     summary: Purchase a package
 *     description: Purchase an investment package for the authenticated user
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Package ID to purchase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [crypto, bank_transfer, card]
 *               payment_details:
 *                 type: object
 *                 description: Payment method specific details
 *     responses:
 *       200:
 *         description: Package purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserPackage'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/purchase/:id', auth, packageController.purchasePackage);

/**
 * @swagger
 * /packages/user:
 *   get:
 *     summary: Get user packages
 *     description: Retrieves list of packages purchased by the authenticated user
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPackage'
 */
router.get('/user', auth, packageController.getUserPackages);

/**
 * @swagger
 * /packages/upgrade-history:
 *   get:
 *     summary: Get upgrade history
 *     description: Retrieves list of package upgrades for the authenticated user
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upgrade history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       package_id:
 *                         type: integer
 *                       upgrade_date:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [success, failed]
 *                       transaction_id:
 *                         type: string
 */
router.get('/upgrade-history', auth, packageController.getUpgradeHistory);

/**
 * @swagger
 * /packages/upgrade:
 *   post:
 *     summary: Upgrade package
 *     description: Upgrades the package of the authenticated user
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *             properties:
 *               package_id:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *                 enum: [crypto, bank_transfer, card]
 *               payment_details:
 *                 type: object
 *                 description: Payment method specific details
 *     responses:
 *       200:
 *         description: Package upgraded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     package_id:
 *                       type: integer
 *                     upgrade_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [success, failed]
 *                     transaction_id:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/upgrade', auth, packageController.upgradePackage);

module.exports = router;
