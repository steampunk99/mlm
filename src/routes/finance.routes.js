const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const { Commission, Withdrawal } = require('../models');

// Get commission history
router.get('/commissions', isActive, async (req, res) => {
    try {
        const commissions = await Commission.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: commissions
        });
    } catch (error) {
        console.error('Get commissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving commission history'
        });
    }
});

// Get withdrawal history
router.get('/withdrawals', isActive, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: withdrawals
        });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving withdrawal history'
        });
    }
});

// Request withdrawal
router.post('/withdrawals', isActive, async (req, res) => {
    try {
        const { amount, method, details } = req.body;
        const userId = req.user.id;

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
            userId,
            amount,
            method,
            details,
            status: 'PENDING'
        });

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: withdrawal
        });
    } catch (error) {
        console.error('Create withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating withdrawal request'
        });
    }
});

// Admin: Process withdrawal
router.put('/withdrawals/:id', isActive, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        // Update withdrawal status
        const withdrawal = await Withdrawal.findByPk(id);
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        await withdrawal.update({
            status,
            remarks,
            processedAt: new Date(),
            processedBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Withdrawal request processed successfully',
            data: withdrawal
        });
    } catch (error) {
        console.error('Process withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing withdrawal request'
        });
    }
});

module.exports = router;
