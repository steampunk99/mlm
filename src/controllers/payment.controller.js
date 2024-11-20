const { Node, NodePayment, NodeStatement, Package } = require('../models');
const { validatePayment } = require('../middleware/validate');
const { calculateCommissions } = require('../utils/commission.utils');
const { sequelize, Op } = require('../config/database');

class PaymentController {
    /**
     * Process package purchase payment
     * @param {Request} req 
     * @param {Response} res 
     */
    async processPackagePayment(req, res) {
        const t = await sequelize.transaction();

        try {
            const { error } = validatePayment(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            const { package_id, payment_method, payment_reference } = req.body;
            const userId = req.user.id;

            // Get package details
            const pkg = await Package.findByPk(package_id);
            if (!pkg || !pkg.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive package'
                });
            }

            // Get user details
            const user = await Node.findByPk(userId);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Create payment record
            const payment = await NodePayment.create({
                node_id: userId,
                node_username: user.username,
                node_position: user.position,
                package_id: pkg.id,
                package_name: pkg.name,
                amount: pkg.price,
                payment_type: payment_method,
                payment_reference: payment_reference,
                status: 'completed',
                payment_date: new Date(),
                payment_timestamp: new Date()
            }, { transaction: t });

            // Update user's package
            await user.update({
                package_id: pkg.id,
                package_name: pkg.name,
                package_price: pkg.price,
                status: 'active',
                time_last_modified: new Date()
            }, { transaction: t });

            // Create statement record
            await NodeStatement.create({
                node_id: userId,
                node_username: user.username,
                node_position: user.position,
                amount: pkg.price,
                description: `Package purchase: ${pkg.name}`,
                is_debit: true,
                is_credit: false,
                is_effective: true,
                event_date: new Date(),
                event_timestamp: new Date()
            }, { transaction: t });

            // Calculate and distribute commissions
            await calculateCommissions(user, pkg, t);

            await t.commit();

            res.status(201).json({
                success: true,
                message: 'Payment processed successfully',
                data: {
                    payment_id: payment.id,
                    package_name: pkg.name,
                    amount: pkg.price,
                    status: 'completed'
                }
            });

        } catch (error) {
            await t.rollback();
            console.error('Payment processing error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get user's payment history
     * @param {Request} req 
     * @param {Response} res 
     */
    async getPaymentHistory(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, status } = req.query;

            const whereClause = {
                node_id: userId
            };

            if (startDate && endDate) {
                whereClause.payment_date = {
                    [Op.between]: [startDate, endDate]
                };
            }

            if (status) {
                whereClause.status = status;
            }

            const payments = await NodePayment.findAll({
                where: whereClause,
                order: [['payment_date', 'DESC']]
            });

            res.json({
                success: true,
                data: payments
            });

        } catch (error) {
            console.error('Get payment history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new PaymentController();
