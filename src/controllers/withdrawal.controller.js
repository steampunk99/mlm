const { Withdrawal, Node, Transaction, sequelize } = require('../models');
const { validateWithdrawalRequest, validateWithdrawalUpdate, validateWithdrawalFilter } = require('../middleware/withdrawal.validate');
const { Op } = require('sequelize');

class WithdrawalController {
    /**
     * Request a new withdrawal
     * @param {Request} req 
     * @param {Response} res 
     */
    async requestWithdrawal(req, res) {
        const t = await sequelize.transaction();

        try {
            const userId = req.user.id;

            // Validate request
            const { error } = validateWithdrawalRequest(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            // Get user's available balance
            const node = await Node.findByPk(userId);
            if (!node) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const { amount, withdrawal_method, ...paymentDetails } = req.body;

            // Check if amount is within limits
            if (amount > node.available_balance) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }

            // Check withdrawal limits
            const todayWithdrawals = await Withdrawal.sum('amount', {
                where: {
                    node_id: userId,
                    created_at: {
                        [Op.gte]: new Date().setHours(0, 0, 0, 0)
                    },
                    status: {
                        [Op.notIn]: ['rejected', 'cancelled']
                    }
                }
            }) || 0;

            const nodePackage = await node.getActivePackage();
            if (!nodePackage) {
                return res.status(400).json({
                    success: false,
                    message: 'No active package found'
                });
            }

            if (todayWithdrawals + amount > nodePackage.max_daily_withdrawal) {
                return res.status(400).json({
                    success: false,
                    message: 'Daily withdrawal limit exceeded'
                });
            }

            // Create withdrawal request
            const withdrawal = await Withdrawal.create({
                node_id: userId,
                amount,
                withdrawal_method,
                ...paymentDetails
            }, { transaction: t });

            // Create transaction record
            await Transaction.create({
                node_id: userId,
                type: 'withdrawal',
                amount: -amount,
                status: 'pending',
                reference_id: withdrawal.id,
                metadata: {
                    withdrawal_method,
                    ...paymentDetails
                }
            }, { transaction: t });

            // Update user's balance
            await node.decrement('available_balance', {
                by: amount,
                transaction: t
            });

            await t.commit();

            res.status(201).json({
                success: true,
                message: 'Withdrawal request submitted successfully',
                data: withdrawal
            });

        } catch (error) {
            await t.rollback();
            console.error('Request withdrawal error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get user's withdrawal history
     * @param {Request} req 
     * @param {Response} res 
     */
    async getWithdrawalHistory(req, res) {
        try {
            const userId = req.user.id;

            // Validate filters
            const { error } = validateWithdrawalFilter(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const {
                status,
                withdrawal_method,
                start_date,
                end_date,
                min_amount,
                max_amount,
                page = 1,
                limit = 10
            } = req.query;

            // Build where clause
            const where = { node_id: userId };
            if (status) where.status = status;
            if (withdrawal_method) where.withdrawal_method = withdrawal_method;
            if (start_date || end_date) {
                where.created_at = {};
                if (start_date) where.created_at[Op.gte] = new Date(start_date);
                if (end_date) where.created_at[Op.lte] = new Date(end_date);
            }
            if (min_amount || max_amount) {
                where.amount = {};
                if (min_amount) where.amount[Op.gte] = min_amount;
                if (max_amount) where.amount[Op.lte] = max_amount;
            }

            // Get withdrawals with pagination
            const withdrawals = await Withdrawal.findAndCountAll({
                where,
                order: [['created_at', 'DESC']],
                limit,
                offset: (page - 1) * limit
            });

            res.json({
                success: true,
                data: {
                    withdrawals: withdrawals.rows,
                    pagination: {
                        total: withdrawals.count,
                        page: parseInt(page),
                        pages: Math.ceil(withdrawals.count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get withdrawal history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Cancel a pending withdrawal request
     * @param {Request} req 
     * @param {Response} res 
     */
    async cancelWithdrawal(req, res) {
        const t = await sequelize.transaction();

        try {
            const userId = req.user.id;
            const { id } = req.params;

            // Find withdrawal
            const withdrawal = await Withdrawal.findOne({
                where: {
                    id,
                    node_id: userId,
                    status: 'pending'
                }
            });

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Pending withdrawal not found'
                });
            }

            // Update withdrawal status
            await withdrawal.update({
                status: 'cancelled',
                cancelled_at: new Date()
            }, { transaction: t });

            // Reverse transaction
            await Transaction.create({
                node_id: userId,
                type: 'withdrawal_reversal',
                amount: withdrawal.amount,
                status: 'completed',
                reference_id: withdrawal.id,
                metadata: {
                    original_withdrawal_id: withdrawal.id,
                    reason: 'User cancelled'
                }
            }, { transaction: t });

            // Update user's balance
            await Node.increment('available_balance', {
                by: withdrawal.amount,
                where: { id: userId },
                transaction: t
            });

            await t.commit();

            res.json({
                success: true,
                message: 'Withdrawal cancelled successfully'
            });

        } catch (error) {
            await t.rollback();
            console.error('Cancel withdrawal error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Process withdrawal request (Admin only)
     * @param {Request} req 
     * @param {Response} res 
     */
    async processWithdrawal(req, res) {
        const t = await sequelize.transaction();

        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate update data
            const { error } = validateWithdrawalUpdate(updateData);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            // Find withdrawal
            const withdrawal = await Withdrawal.findOne({
                where: {
                    id,
                    status: {
                        [Op.in]: ['pending', 'processing']
                    }
                }
            });

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: 'Withdrawal not found or already processed'
                });
            }

            // Update withdrawal status
            const updates = {
                status: updateData.status,
                admin_note: updateData.admin_note
            };

            if (updateData.status === 'processing') {
                updates.processed_at = new Date();
            } else if (updateData.status === 'completed') {
                updates.completed_at = new Date();
                updates.transaction_hash = updateData.transaction_hash;
            } else if (updateData.status === 'rejected') {
                updates.rejection_reason = updateData.rejection_reason;

                // Return funds to user
                await Node.increment('available_balance', {
                    by: withdrawal.amount,
                    where: { id: withdrawal.node_id },
                    transaction: t
                });

                // Create reversal transaction
                await Transaction.create({
                    node_id: withdrawal.node_id,
                    type: 'withdrawal_reversal',
                    amount: withdrawal.amount,
                    status: 'completed',
                    reference_id: withdrawal.id,
                    metadata: {
                        original_withdrawal_id: withdrawal.id,
                        reason: updateData.rejection_reason
                    }
                }, { transaction: t });
            }

            await withdrawal.update(updates, { transaction: t });

            await t.commit();

            res.json({
                success: true,
                message: `Withdrawal ${updateData.status} successfully`,
                data: withdrawal
            });

        } catch (error) {
            await t.rollback();
            console.error('Process withdrawal error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get all withdrawals (Admin only)
     * @param {Request} req 
     * @param {Response} res 
     */
    async getAllWithdrawals(req, res) {
        try {
            // Validate filters
            const { error } = validateWithdrawalFilter(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const {
                status,
                withdrawal_method,
                start_date,
                end_date,
                min_amount,
                max_amount,
                page = 1,
                limit = 10
            } = req.query;

            // Build where clause
            const where = {};
            if (status) where.status = status;
            if (withdrawal_method) where.withdrawal_method = withdrawal_method;
            if (start_date || end_date) {
                where.created_at = {};
                if (start_date) where.created_at[Op.gte] = new Date(start_date);
                if (end_date) where.created_at[Op.lte] = new Date(end_date);
            }
            if (min_amount || max_amount) {
                where.amount = {};
                if (min_amount) where.amount[Op.gte] = min_amount;
                if (max_amount) where.amount[Op.lte] = max_amount;
            }

            // Get withdrawals with pagination
            const withdrawals = await Withdrawal.findAndCountAll({
                where,
                include: [{
                    model: Node,
                    attributes: ['username', 'email']
                }],
                order: [['created_at', 'DESC']],
                limit,
                offset: (page - 1) * limit
            });

            res.json({
                success: true,
                data: {
                    withdrawals: withdrawals.rows,
                    pagination: {
                        total: withdrawals.count,
                        page: parseInt(page),
                        pages: Math.ceil(withdrawals.count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get all withdrawals error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new WithdrawalController();
