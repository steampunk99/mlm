const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { isActive } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - username
 *         - firstName
 *         - lastName
 *         - phone
 *         - country
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *         username:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         country:
 *           type: string
 *   responses:
 *     UnauthorizedError:
 *       description: Authentication information is missing or invalid
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('sponsorUsername').trim().notEmpty(),
    body('placementUsername').trim().notEmpty(),
    body('position').isIn([1, 2]),
    validate
], authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
], authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 */
router.post('/logout', isActive, authController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail(),
    validate
], authController.requestPasswordReset);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 */
router.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
    validate
], authController.resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password while logged in
 *     tags: [Authentication]
 */
router.post('/change-password', [
    isActive,
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    validate
], authController.requestPasswordReset);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 */
router.get('/profile', isActive, authController.getProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 */
router.put('/profile', [
    isActive,
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
    body('country').optional().trim(),
    validate
], authController.updateProfile);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 */
router.post('/verify-email', [
    body('token').notEmpty(),
    validate
], authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 */
router.post('/resend-verification', [
    body('email').isEmail().normalizeEmail(),
    validate
], authController.resendVerification);

/**
 * @swagger
 * /auth/2fa/enable:
 *   post:
 *     summary: Enable two-factor authentication
 *     tags: [Authentication]
 */
router.post('/2fa/enable', isActive, authController.enable2FA);

/**
 * @swagger
 * /auth/2fa/disable:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Authentication]
 */
router.post('/2fa/disable', isActive, authController.disable2FA);

/**
 * @swagger
 * /auth/2fa/verify:
 *   post:
 *     summary: Verify 2FA token
 *     tags: [Authentication]
 */
router.post('/2fa/verify', [
    body('token').notEmpty(),
    validate
], authController.enable2FA);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get all active sessions
 *     tags: [Authentication]
 */
// router.get('/sessions', isActive, authController.getSessions);

/**
 * @swagger
 * /auth/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate specific session
 *     tags: [Authentication]
 */
// router.delete('/sessions/:sessionId', isActive, authController.terminateSession);

/**
 * @swagger
 * /auth/sessions:
 *   delete:
 *     summary: Terminate all sessions except current
 *     tags: [Authentication]
 */
// router.delete('/sessions', isActive, authController.terminateAllSessions);

module.exports = router;
