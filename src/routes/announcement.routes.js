const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const { query, body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const announcementController = require('../controllers/announcement.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - type
 *         - priority
 *         - audience
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         type:
 *           type: string
 *           enum: [NEWS, UPDATE, MAINTENANCE, PROMOTION]
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         audience:
 *           type: string
 *           enum: [ALL, USER, ADMIN]
 *         expiryDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create new announcement
 *     tags: [Announcements]
 */
router.post('/', [
    isAdmin,
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
    body('type').isIn(['NEWS', 'UPDATE', 'MAINTENANCE', 'PROMOTION']),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('audience').isIn(['ALL', 'USER', 'ADMIN']),
    body('expiryDate').optional().isISO8601(),
    validate
], announcementController.createAnnouncement);

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get announcements with filters
 *     tags: [Announcements]
 */
router.get('/', [
    isActive,
    query('type').optional().isIn(['NEWS', 'UPDATE', 'MAINTENANCE', 'PROMOTION']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
], announcementController.getAnnouncements);

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     tags: [Announcements]
 */
router.get('/:id', [
    isActive,
    param('id').isString(),
    validate
], announcementController.getAnnouncementById);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Update announcement
 *     tags: [Announcements]
 */
router.put('/:id', [
    isAdmin,
    param('id').isString(),
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('type').optional().isIn(['NEWS', 'UPDATE', 'MAINTENANCE', 'PROMOTION']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('audience').optional().isIn(['ALL', 'USER', 'ADMIN']),
    body('expiryDate').optional().isISO8601(),
    validate
], announcementController.updateAnnouncement);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete announcement
 *     tags: [Announcements]
 */
router.delete('/:id', [
    isAdmin,
    param('id').isString(),
    validate
], announcementController.deleteAnnouncement);

/**
 * @swagger
 * /announcements/stats:
 *   get:
 *     summary: Get announcement statistics
 *     tags: [Announcements]
 */
router.get('/stats', isAdmin, announcementController.getAnnouncementStats);

/**
 * @swagger
 * /announcements/active:
 *   get:
 *     summary: Get active announcements
 *     tags: [Announcements]
 */
router.get('/active', isActive, announcementController.getActiveAnnouncements);

module.exports = router;
