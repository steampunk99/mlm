const { Package, NodePackage, User, Transaction } = require('../models');
const { validatePackagePurchase, validatePackageCreate } = require('../middleware/validate');
const { calculateCommissions } = require('../utils/commission.utils');

class PackageController {
  /**
   * Get all available packages
   * @param {Request} req 
   * @param {Response} res 
   */
  async getAllPackages(req, res) {
    try {
      const packages = await Package.findAll({
        where: { is_deleted: false }
      });

      res.json({
        success: true,
        data: packages
      });

    } catch (error) {
      console.error('Get packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's purchased packages
   * @param {Request} req 
   * @param {Response} res 
   */
  async getUserPackages(req, res) {
    try {
      const userId = req.user.id;

      const packages = await NodePackage.findAll({
        where: {
          node_id: userId,
          is_deleted: false
        },
        include: [{
          model: Package,
          attributes: ['name', 'description', 'benefits']
        }]
      });

      res.json({
        success: true,
        data: packages
      });

    } catch (error) {
      console.error('Get user packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Purchase a new package
   * @param {Request} req 
   * @param {Response} res 
   */
  async purchasePackage(req, res) {
    try {
      // Validate request
      const { error } = validatePackagePurchase(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { package_id, payment_method, phone_number } = req.body;
      const userId = req.user.id;

      // Get package details
      const pkg = await Package.findOne({
        where: {
          id: package_id,
          is_deleted: false
        }
      });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user already has this package
      const existingPackage = await NodePackage.findOne({
        where: {
          node_id: userId,
          package_id,
          is_deleted: false
        }
      });

      if (existingPackage) {
        return res.status(400).json({
          success: false,
          message: 'You already have this package'
        });
      }

      // Create package purchase record
      const nodePurchase = await NodePackage.create({
        node_id: userId,
        node_position: user.position,
        node_username: user.username,
        package_id,
        package_name: pkg.name,
        price: pkg.price,
        is_paid: false,
        payment_type: payment_method,
        payment_phone_number: phone_number
      });

      // TODO: Integrate with payment gateway
      // For now, we'll just mark it as paid
      await nodePurchase.update({ is_paid: true });

      res.status(201).json({
        success: true,
        message: 'Package purchased successfully',
        data: nodePurchase
      });

    } catch (error) {
      console.error('Purchase package error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create a new package (Admin only)
   * @param {Request} req 
   * @param {Response} res 
   */
  async createPackage(req, res) {
    try {
      // Validate request
      const { error } = validatePackageCreate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const {
        name,
        price,
        description,
        benefits,
        level,
        max_daily_earnings,
        binary_bonus_percentage,
        referral_bonus_percentage
      } = req.body;

      // Create new package
      const newPackage = await Package.create({
        name,
        price,
        description,
        benefits,
        level,
        max_daily_earnings,
        binary_bonus_percentage,
        referral_bonus_percentage
      });

      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: newPackage
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
   * Update package details (Admin only)
   * @param {Request} req 
   * @param {Response} res 
   */
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Find package
      const pkg = await Package.findOne({
        where: { id, is_deleted: false }
      });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      // Update package
      await pkg.update(updateData);

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
   * Delete package (Admin only)
   * @param {Request} req 
   * @param {Response} res 
   */
  async deletePackage(req, res) {
    try {
      const { id } = req.params;

      // Find package
      const pkg = await Package.findOne({
        where: { id, is_deleted: false }
      });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      // Soft delete package
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
   * Upgrade existing package
   * @param {Request} req 
   * @param {Response} res 
   */
  async upgradePackage(req, res) {
    try {
      const { current_package_id, new_package_id, payment_method, phone_number } = req.body;
      const userId = req.user.id;

      // Get current package
      const currentPackage = await NodePackage.findOne({
        where: {
          node_id: userId,
          package_id: current_package_id,
          is_deleted: false
        }
      });

      if (!currentPackage) {
        return res.status(404).json({
          success: false,
          message: 'Current package not found'
        });
      }

      // Get new package details
      const newPackage = await Package.findOne({
        where: {
          id: new_package_id,
          is_deleted: false
        }
      });

      if (!newPackage) {
        return res.status(404).json({
          success: false,
          message: 'New package not found'
        });
      }

      // Calculate upgrade price
      const upgradeCost = newPackage.price - currentPackage.price;
      if (upgradeCost <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot upgrade to a package with same or lower price'
        });
      }

      // Create upgrade transaction
      const transaction = await Transaction.create({
        node_id: userId,
        type: 'package_upgrade',
        amount: upgradeCost,
        status: 'pending',
        payment_method,
        phone_number,
        metadata: {
          old_package_id: current_package_id,
          new_package_id: new_package_id,
          old_package_name: currentPackage.package_name,
          new_package_name: newPackage.name
        }
      });

      // Update user's package after payment confirmation
      await currentPackage.update({
        is_deleted: true,
        end_date: new Date()
      });

      const newUserPackage = await NodePackage.create({
        node_id: userId,
        node_position: currentPackage.node_position,
        node_username: currentPackage.node_username,
        package_id: new_package_id,
        package_name: newPackage.name,
        price: newPackage.price,
        is_paid: true,
        payment_type: payment_method,
        payment_phone_number: phone_number,
        upgraded_from: current_package_id
      });

      // Calculate and distribute upgrade commissions
      await calculateCommissions(userId, upgradeCost, 'upgrade');

      res.json({
        success: true,
        message: 'Package upgraded successfully',
        data: {
          transaction,
          new_package: newUserPackage
        }
      });

    } catch (error) {
      console.error('Upgrade package error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get package upgrade history
   * @param {Request} req 
   * @param {Response} res 
   */
  async getUpgradeHistory(req, res) {
    try {
      const userId = req.user.id;

      const upgrades = await NodePackage.findAll({
        where: {
          node_id: userId,
          upgraded_from: { [Op.ne]: null }
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: upgrades
      });

    } catch (error) {
      console.error('Get upgrade history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PackageController();
