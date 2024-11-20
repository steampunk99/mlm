const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const networkRoutes = require('./network.routes');
const packageRoutes = require('./package.routes');
const financeRoutes = require('./finance.routes');
const adminRoutes = require('./admin.routes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes
const { authenticateToken } = require('../middleware/auth');
router.use('/network', authenticateToken, networkRoutes);
router.use('/packages', authenticateToken, packageRoutes);
router.use('/finance', authenticateToken, financeRoutes);
router.use('/admin', authenticateToken, adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
