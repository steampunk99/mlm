const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const networkController = require('../controllers/network.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     NetworkNode:
 *       type: object
 *       required:
 *         - user_id
 *         - sponsor_id
 *         - placement_id
 *         - position
 *         - level
 *       properties:
 *         id:
 *           type: integer
 *           description: Node ID
 *         user_id:
 *           type: integer
 *           description: User ID associated with this node
 *         sponsor_id:
 *           type: integer
 *           description: ID of the sponsor node
 *         placement_id:
 *           type: integer
 *           description: ID of the placement node (upline)
 *         position:
 *           type: integer
 *           enum: [1, 2]
 *           description: Position in binary tree (1 for left, 2 for right)
 *         level:
 *           type: integer
 *           description: Level in the network hierarchy
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     NetworkStats:
 *       type: object
 *       properties:
 *         total_downline:
 *           type: integer
 *         direct_referrals:
 *           type: integer
 *         left_team:
 *           type: integer
 *         right_team:
 *           type: integer
 *         left_business:
 *           type: number
 *           format: float
 *         right_business:
 *           type: number
 *           format: float
 */

/**
 * @swagger
 * /network/genealogy:
 *   get:
 *     summary: Get user's network genealogy
 *     description: Retrieves the binary tree structure showing user's downline
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: ID of the user to get genealogy for (defaults to authenticated user)
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *         description: Number of levels to retrieve
 *     responses:
 *       200:
 *         description: Network genealogy retrieved successfully
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
 *                     node:
 *                       $ref: '#/components/schemas/NetworkNode'
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NetworkNode'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/genealogy', auth, networkController.getGenealogy);

/**
 * @swagger
 * /network/stats:
 *   get:
 *     summary: Get user's network statistics
 *     description: Retrieves network statistics including team sizes and business volumes
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Network statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NetworkStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', auth, networkController.getStats);

/**
 * @swagger
 * /network/referrals:
 *   get:
 *     summary: Get user's direct referrals
 *     description: Retrieves list of users directly referred by the authenticated user
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Direct referrals retrieved successfully
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
 *                     $ref: '#/components/schemas/NetworkNode'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/referrals', auth, networkController.getReferrals);

/**
 * @swagger
 * /network/placement-options:
 *   get:
 *     summary: Get available placement positions
 *     description: Retrieves available positions for placing a new member in the binary tree
 *     tags: [Network]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: placement_username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the potential placement sponsor
 *     responses:
 *       200:
 *         description: Available positions retrieved successfully
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
 *                     left_available:
 *                       type: boolean
 *                     right_available:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/placement-options', auth, networkController.getPlacementOptions);

// Get direct referrals (sponsored users)
router.get('/referrals', auth, networkController.getDirectReferrals);

// Get direct children in binary tree (left and right nodes)
router.get('/children', auth, networkController.getDirectChildren);

// Get complete binary tree structure
router.get('/binary-tree', auth, networkController.getBinaryTree);

// Get upline/genealogy
router.get('/genealogy', auth, networkController.getGenealogy);

// Get network statistics
router.get('/stats', auth, networkController.getNetworkStats);

module.exports = router;
