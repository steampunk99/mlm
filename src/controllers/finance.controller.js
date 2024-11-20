const nodeStatementService = require('../services/nodeStatement.service');
const nodeWithdrawalService = require('../services/nodeWithdrawal.service');
const nodeService = require('../services/node.service');
const userService = require('../services/user.service');
const { validateWithdrawalRequest } = require('../middleware/validate');
const { calculateCommissions } = require('../utils/commission.utils');

class FinanceController {
  /**
   * Get user's current balance
   * @param {Request} req 
   * @param {Response} res 
   */
  async getBalance(req, res) {
    try {
      const userId = req.user.id;
      const node = await nodeService.findByUserId(userId);
      
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      const balance = await nodeStatementService.getBalance(node.id);

      res.json({
        success: true,
        data: {
          balance: balance.currentBalance,
          totalCredits: balance.totalCredits,
          totalDebits: balance.totalDebits
        }
      });

    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving balance'
      });
    }
  }

  /**
   * Get user's statement/transactions
   * @param {Request} req 
   * @param {Response} res 
   */
  async getStatement(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, type } = req.query;
      
      const node = await nodeService.findByUserId(userId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      const statements = await nodeStatementService.findAll(node.id, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        type
      });

      res.json({
        success: true,
        data: statements
      });

    } catch (error) {
      console.error('Get statement error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving statements'
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
      const { amount, paymentMethod, phoneNumber } = req.body;

      const node = await nodeService.findByUserId(userId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      // Check user's balance
      const balance = await nodeStatementService.getBalance(node.id);
      if (balance.currentBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Check pending withdrawals
      const pendingWithdrawals = await nodeWithdrawalService.findPendingByNodeId(node.id);
      if (pendingWithdrawals.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending withdrawal request'
        });
      }

      const withdrawal = await nodeWithdrawalService.create({
        nodeId: node.id,
        amount,
        paymentMethod,
        paymentPhone: phoneNumber,
        status: 'PENDING'
      });

      // Create statement record for withdrawal
      await nodeStatementService.create({
        nodeId: node.id,
        amount,
        type: 'DEBIT',
        description: 'Withdrawal request',
        status: 'PENDING',
        referenceType: 'WITHDRAWAL',
        referenceId: withdrawal.id
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
        message: 'Error processing withdrawal request'
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

      const node = await nodeService.findByUserId(userId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      const withdrawals = await nodeWithdrawalService.findAll(node.id, {
        status
      });

      res.json({
        success: true,
        data: withdrawals
      });

    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving withdrawals'
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
      const { packagePurchaseId } = req.body;
      
      // Get package purchase details and calculate commissions
      const commissions = await calculateCommissions(packagePurchaseId);

      // Create commission statements
      const statements = await Promise.all(commissions.map(commission => 
        nodeStatementService.create({
          nodeId: commission.nodeId,
          amount: commission.amount,
          type: 'CREDIT',
          description: commission.reason,
          status: 'COMPLETED',
          referenceType: 'PACKAGE',
          referenceId: packagePurchaseId
        })
      ));

      res.json({
        success: true,
        message: 'Commissions distributed successfully',
        data: statements
      });

    } catch (error) {
      console.error('Distribute commissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error distributing commissions'
      });
    }
  }
}

module.exports = new FinanceController();
