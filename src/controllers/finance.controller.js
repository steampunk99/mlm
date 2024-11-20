const { NodeStatement, NodeWithdrawal, NodeChildren, User } = require('../models');
const { validateWithdrawalRequest } = require('../middleware/validate');
const { calculateCommissions } = require('../utils/commissionUtils');
const { Op } = require('sequelize');

class FinanceController {
  /**
   * Get user's statement/transactions
   * @param {Request} req 
   * @param {Response} res 
   */
  async getStatement(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, type } = req.query;
      
      const whereClause = {
        node_id: userId,
        is_deleted: false
      };

      if (startDate && endDate) {
        whereClause.event_date = {
          [Op.between]: [startDate, endDate]
        };
      }

      if (type === 'credit') {
        whereClause.is_credit = true;
      } else if (type === 'debit') {
        whereClause.is_debit = true;
      }

      const statements = await NodeStatement.findAll({
        where: whereClause,
        order: [['event_date', 'DESC']]
      });

      res.json({
        success: true,
        data: statements
      });

    } catch (error) {
      console.error('Get statement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's current balance
   * @param {Request} req 
   * @param {Response} res 
   */
  async getBalance(req, res) {
    try {
      const userId = req.user.id;

      const credits = await NodeStatement.sum('amount', {
        where: {
          node_id: userId,
          is_credit: true,
          is_effective: true,
          is_deleted: false
        }
      }) || 0;

      const debits = await NodeStatement.sum('amount', {
        where: {
          node_id: userId,
          is_debit: true,
          is_effective: true,
          is_deleted: false
        }
      }) || 0;

      const balance = credits - debits;

      res.json({
        success: true,
        data: {
          balance,
          total_credits: credits,
          total_debits: debits
        }
      });

    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Request withdrawal
   * @param {Request} req 
   * @param {Response} res 
   */
  async requestWithdrawal(req, res) {
    try {
      const { error } = validateWithdrawalRequest(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const userId = req.user.id;
      const { amount, payment_method, phone_number } = req.body;

      // Check user's balance
      const balance = await this.getUserBalance(userId);
      if (balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Check pending withdrawals
      const pendingWithdrawal = await NodeWithdrawal.findOne({
        where: {
          node_id: userId,
          status: 'pending',
          is_deleted: false
        }
      });

      if (pendingWithdrawal) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending withdrawal request'
        });
      }

      const user = await User.findByPk(userId);
      const withdrawal = await NodeWithdrawal.create({
        node_id: userId,
        node_position: user.position,
        node_username: user.username,
        amount,
        payment_type: payment_method,
        payment_phone_number: phone_number,
        status: 'pending',
        withdrawal_date: new Date(),
        withdrawal_timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: withdrawal
      });

    } catch (error) {
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
  async getWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const whereClause = {
        node_id: userId,
        is_deleted: false
      };

      if (status) {
        whereClause.status = status;
      }

      const withdrawals = await NodeWithdrawal.findAll({
        where: whereClause,
        order: [['withdrawal_date', 'DESC']]
      });

      res.json({
        success: true,
        data: withdrawals
      });

    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Calculate and distribute commissions
   * @param {Request} req 
   * @param {Response} res 
   */
  async distributeCommissions(req, res) {
    try {
      const { package_purchase_id } = req.body;
      
      // Get package purchase details and calculate commissions
      const commissions = await calculateCommissions(package_purchase_id);

      // Create commission statements
      for (const commission of commissions) {
        await NodeStatement.create({
          node_id: commission.node_id,
          node_position: commission.node_position,
          node_username: commission.node_username,
          amount: commission.amount,
          is_credit: true,
          is_debit: false,
          reason: commission.reason,
          table_name: 'node_package',
          table_id: package_purchase_id,
          event_date: new Date(),
          event_timestamp: new Date(),
          is_effective: true
        });
      }

      res.json({
        success: true,
        message: 'Commissions distributed successfully',
        data: commissions
      });

    } catch (error) {
      console.error('Distribute commissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Helper method to get user's current balance
   * @param {number} userId 
   * @returns {Promise<number>}
   */
  async getUserBalance(userId) {
    const credits = await NodeStatement.sum('amount', {
      where: {
        node_id: userId,
        is_credit: true,
        is_effective: true,
        is_deleted: false
      }
    }) || 0;

    const debits = await NodeStatement.sum('amount', {
      where: {
        node_id: userId,
        is_debit: true,
        is_effective: true,
        is_deleted: false
      }
    }) || 0;

    return credits - debits;
  }
}

module.exports = new FinanceController();
