const express = require('express');
const router = express.Router();
const { isActive } = require('../middleware/auth');
const { query, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const networkController = require('../controllers/network.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     NetworkNode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         sponsorId:
 *           type: string
 *         placementId:
 *           type: string
 *         position:
 *           type: integer
 *           enum: [1, 2]
 *         level:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /network/referrals:
 *   get:
 *     summary: Get direct referrals
 *     tags: [Network]
 */
router.get('/referrals', isActive, networkController.getDirectReferrals);

/**
 * @swagger
 * /network/children:
 *   get:
 *     summary: Get direct children in binary tree
 *     tags: [Network]
 */
router.get('/children', isActive, networkController.getDirectChildren);

/**
 * @swagger
 * /network/binary-tree:
 *   get:
 *     summary: Get binary tree structure
 *     tags: [Network]
 */
router.get('/binary-tree', [
    isActive,
    query('maxLevel').optional().isInt({ min: 1, max: 10 }).default(3),
    validate
], networkController.getBinaryTree);

/**
 * @swagger
 * /network/genealogy:
 *   get:
 *     summary: Get genealogy tree
 *     tags: [Network]
 */
router.get('/genealogy', [
    isActive,
    query('depth').optional().isInt({ min: 1, max: 10 }).default(3),
    validate
], networkController.getGenealogyTree);

/**
 * @swagger
 * /network/stats:
 *   get:
 *     summary: Get network statistics
 *     tags: [Network]
 */
router.get('/stats', isActive, networkController.getNetworkStats);

/**
 * @swagger
 * /network/team-performance:
 *   get:
 *     summary: Get team performance metrics
 *     tags: [Network]
 */
router.get('/team-performance', [
    isActive,
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate
], networkController.getTeamPerformance);

/**
 * @swagger
 * /network/business-volume:
 *   get:
 *     summary: Get business volume statistics
 *     tags: [Network]
 */
router.get('/business-volume', [
    isActive,
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate
], networkController.getBusinessVolume);

/**
 * @swagger
 * /network/rank-qualification:
 *   get:
 *     summary: Get rank qualification status
 *     tags: [Network]
 */
router.get('/rank-qualification', isActive, networkController.getRankQualification);

/**
 * @swagger
 * /network/team-structure:
 *   get:
 *     summary: Get team structure view
 *     tags: [Network]
 */
router.get('/team-structure', [
    isActive,
    query('view').optional().isIn(['binary', 'unilevel', 'matrix']).default('binary'),
    validate
], networkController.getTeamStructure);

/**
 * @swagger
 * /network/search:
 *   get:
 *     summary: Search network members
 *     tags: [Network]
 */
router.get('/search', [
    isActive,
    query('query').notEmpty(),
    query('type').optional().isIn(['username', 'name', 'email']).default('username'),
    validate
], networkController.searchNetwork);

module.exports = router;
