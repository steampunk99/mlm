const userService = require('../services/user.service');
const nodeService = require('../services/node.service');
const packageService = require('../services/package.service');
const nodePackageService = require('../services/nodePackage.service');
const nodeWithdrawalService = require('../services/nodeWithdrawal.service');
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
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const users = await userService.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: {
          users: users.data,
          total: users.total,
          pages: users.pages,
          currentPage: users.currentPage
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving users'
      });
    }
  }

  /**
   * Get user by ID with full details
   * @param {Request} req 
   * @param {Response} res 
   */
  async getUserDetails(req, res) {
    try {
      const { id } = req.params;

      const user = await userService.findById(id, {
        includeNode: true,
        includePackages: true,
        includeWithdrawals: true
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user details'
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

      const user = await userService.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await userService.updateStatus(id, status);

      res.json({
        success: true,
        message: 'User status updated successfully'
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user status'
      });
    }
  }

  /**
   * Delete user (soft delete)
   * @param {Request} req 
   * @param {Response} res 
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await userService.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await userService.softDelete(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  }

  /**
   * Get system statistics
   * @param {Request} req 
   * @param {Response} res 
   */
  async getSystemStats(req, res) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalNodes,
        activeNodes,
        totalPackages,
        activePackages,
        pendingWithdrawals
      ] = await Promise.all([
        userService.count(),
        userService.count({ status: 'ACTIVE' }),
        nodeService.count(),
        nodeService.count({ status: 'ACTIVE' }),
        packageService.count(),
        packageService.count({ status: 'ACTIVE' }),
        nodeWithdrawalService.count({ status: 'PENDING' })
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers
          },
          nodes: {
            total: totalNodes,
            active: activeNodes
          },
          packages: {
            total: totalPackages,
            active: activePackages
          },
          pendingWithdrawals
        }
      });

    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving system statistics'
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

      const pkg = await packageService.create(req.body);

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

      const pkg = await packageService.findById(id);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      await packageService.update(id, req.body);

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

      const pkg = await packageService.findById(id);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      await packageService.delete(id);

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

      const withdrawal = await nodeWithdrawalService.findById(id);
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

      await nodeWithdrawalService.update(id, {
        status,
        reason: reason || null
      });

      // If rejected, create a reversal statement
      if (status === 'rejected') {
        await nodePackageService.createReversalStatement(withdrawal);
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
}

module.exports = new AdminController();
