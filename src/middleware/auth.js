const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');

/**
 * Middleware to authenticate JWT token
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Access token is required'
            });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.active) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Middleware to check if user is admin
 */
exports.isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user is active
 */
exports.isActive = async (req, res, next) => {
    try {
        if (!req.user || !req.user.active) {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = auth;
