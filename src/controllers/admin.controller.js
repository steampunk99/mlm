const { User, NodePackage, NodeWithdrawal, Package } = require('../models');
const { validatePackage } = require('../middleware/validate');

class AdminController {
  /**
   * Get all users with pagination and filters
   * @param {Request} req 
   * @param {Response} res 
   */
  async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        search,
        sort_by = 'id',
        sort_order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { is_deleted: false };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { full_name: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order]]
      });

      res.json({
        success: true,
        data: {
          users: rows,
          total: count,
          pages: Math.ceil(count / limit),
          current_page: parseInt(page)
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user status
   * @param {Request} req 
   * @param {Response} res 
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ status });

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: user
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create new package
   * @param {Request} req 
   * @param {Response} res 
   */
  async createPackage(req, res) {
    try {
      const { error } = validatePackage(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const pkg = await Package.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: pkg
      });

    } catch (error) {
      console.error('Create package error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update package
   * @param {Request} req 
   * @param {Response} res 
   */
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const { error } = validatePackage(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const pkg = await Package.findByPk(id);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      await pkg.update(req.body);

      res.json({
        success: true,
        message: 'Package updated successfully',
        data: pkg
      });

    } catch (error) {
      console.error('Update package error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete package
   * @param {Request} req 
   * @param {Response} res 
   */
  async deletePackage(req, res) {
    try {
      const { id } = req.params;

      const pkg = await Package.findByPk(id);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      await pkg.update({ is_deleted: true });

      res.json({
        success: true,
        message: 'Package deleted successfully'
      });

    } catch (error) {
      console.error('Delete package error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Process withdrawal request
   * @param {Request} req 
   * @param {Response} res 
   */
  async processWithdrawal(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const withdrawal = await NodeWithdrawal.findByPk(id);
      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal request not found'
        });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Withdrawal request has already been processed'
        });
      }

      await withdrawal.update({
        status,
        reason: reason || null
      });

      // If rejected, create a reversal statement
      if (status === 'rejected') {
        await NodeStatement.create({
          node_id: withdrawal.node_id,
          node_position: withdrawal.node_position,
          node_username: withdrawal.node_username,
          amount: withdrawal.amount,
          is_credit: true,
          is_debit: false,
          reason: 'Withdrawal request rejected - Amount reversed',
          table_name: 'node_withdrawal',
          table_id: withdrawal.id,
          event_date: new Date(),
          event_timestamp: new Date(),
          is_effective: true
        });
      }

      res.json({
        success: true,
        message: 'Withdrawal request processed successfully',
        data: withdrawal
      });

    } catch (error) {
      console.error('Process withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get system statistics
   * @param {Request} req 
   * @param {Response} res 
   */
  async getStatistics(req, res) {
    try {
      const totalUsers = await User.count({
        where: { is_deleted: false }
      });

      const activeUsers = await User.count({
        where: { 
          status: 'active',
          is_deleted: false
        }
      });

      const totalPackages = await NodePackage.count({
        where: { 
          is_paid: true,
          is_deleted: false
        }
      });

      const pendingWithdrawals = await NodeWithdrawal.count({
        where: {
          status: 'pending',
          is_deleted: false
        }
      });

      res.json({
        success: true,
        data: {
          total_users: totalUsers,
          active_users: activeUsers,
          total_packages: totalPackages,
          pending_withdrawals: pendingWithdrawals
        }
      });

    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AdminController();
