const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const authController = require('../controllers/auth.controller');

// Register new user
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone_number').trim().notEmpty(),
    body('sponsor_username').trim().notEmpty(),
    body('placement_username').trim().notEmpty(),
    body('position').isIn([1, 2]),
    validate
], authController.register);

// Login user
router.post('/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
    validate
], authController.login);

module.exports = router;
