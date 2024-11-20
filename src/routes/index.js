const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const networkRoutes = require('./network.routes');
const adminRoutes = require('./admin.routes');
const financeRoutes = require('./finance.routes');
const packageRoutes = require('./package.routes');
const paymentRoutes = require('./payment.routes');
const withdrawalRoutes = require('./withdrawal.routes');
const announcementRoutes = require('./announcement.routes');

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization endpoints
 *   - name: Users
 *     description: User management and profile operations
 *   - name: Network
 *     description: MLM network and genealogy operations
 *   - name: Admin
 *     description: Administrative operations and system management
 *   - name: Finance
 *     description: Financial operations and balance management
 *   - name: Packages
 *     description: Investment package management
 *   - name: Payments
 *     description: Payment processing and history
 *   - name: Withdrawals
 *     description: Withdrawal requests and processing
 *   - name: Announcements
 *     description: System announcements and notifications
 */

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/network', authenticateToken, networkRoutes);
router.use('/admin', authenticateToken, adminRoutes);
router.use('/finance', authenticateToken, financeRoutes);
router.use('/packages', authenticateToken, packageRoutes);
router.use('/payments', authenticateToken, paymentRoutes);
router.use('/withdrawals', authenticateToken, withdrawalRoutes);
router.use('/announcements', authenticateToken, announcementRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Basic API information
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Zillionaire MLM Platform API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api-docs'
  });
});

const { authenticateToken } = require('../middleware/auth');

module.exports = router;
