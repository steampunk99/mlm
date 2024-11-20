const packageService = require('../services/package.service');
const nodePackageService = require('../services/nodePackage.service');
const userService = require('../services/user.service');
const nodeService = require('../services/node.service');
const commissionService = require('../services/commission.service');
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
      const packages = await packageService.findAll();

      res.json({
        success: true,
        data: packages
      });

    } catch (error) {
      console.error('Get packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving packages'
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
      const node = await nodeService.findByUserId(userId);
      
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      const packages = await nodePackageService.findByNodeId(node.id);

      res.json({
        success: true,
        data: packages
      });

    } catch (error) {
      console.error('Get user packages error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user packages'
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

      const { packageId, paymentMethod, phoneNumber } = req.body;
      const userId = req.user.id;

      // Get package details
      const pkg = await packageService.findById(packageId);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      // Get node details
      const node = await nodeService.findByUserId(userId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      // Check if node already has this package
      const existingPackage = await nodePackageService.findActivePackagesByNodeId(node.id);
      if (existingPackage.some(p => p.packageId === packageId)) {
        return res.status(400).json({
          success: false,
          message: 'You already have this package'
        });
      }

      // Create package purchase in a transaction
      const nodePurchase = await nodePackageService.create({
        nodeId: node.id,
        packageId,
        status: 'PENDING',
        paymentMethod,
        paymentPhone: phoneNumber
      });

      // Calculate and create commissions
      const commissions = await calculateCommissions(node.id, pkg.price);
      await Promise.all(commissions.map(commission => 
        commissionService.create({
          ...commission,
          packageId,
          status: 'PENDING'
        })
      ));

      res.status(201).json({
        success: true,
        message: 'Package purchase initiated',
        data: {
          purchase: nodePurchase,
          package: pkg
        }
      });

    } catch (error) {
      console.error('Purchase package error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing package purchase'
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
      const { error } = validatePackageCreate(req.body);
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
        message: 'Error creating package'
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

      const pkg = await packageService.findById(id);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }

      const updatedPkg = await packageService.update(id, req.body);

      res.json({
        success: true,
        message: 'Package updated successfully',
        data: updatedPkg
      });

    } catch (error) {
      console.error('Update package error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating package'
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
        message: 'Error deleting package'
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
      const { currentPackageId, newPackageId, paymentMethod, phoneNumber } = req.body;
      const userId = req.user.id;

      // Get node details
      const node = await nodeService.findByUserId(userId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      // Validate current package
      const currentPackage = await nodePackageService.findById(currentPackageId);
      if (!currentPackage || currentPackage.nodeId !== node.id) {
        return res.status(404).json({
          success: false,
          message: 'Current package not found'
        });
      }

      // Get new package details
      const newPackage = await packageService.findById(newPackageId);
      if (!newPackage) {
        return res.status(404).json({
          success: false,
          message: 'New package not found'
        });
      }

      // Validate upgrade (ensure new package is higher level)
      if (newPackage.level <= currentPackage.package.level) {
        return res.status(400).json({
          success: false,
          message: 'New package must be of a higher level'
        });
      }

      // Create upgrade record
      const upgrade = await nodePackageService.create({
        nodeId: node.id,
        packageId: newPackageId,
        status: 'PENDING',
        paymentMethod,
        paymentPhone: phoneNumber,
        isUpgrade: true,
        previousPackageId: currentPackageId
      });

      // Calculate upgrade commissions (difference in package prices)
      const priceDifference = newPackage.price - currentPackage.package.price;
      const commissions = await calculateCommissions(node.id, priceDifference);
      await Promise.all(commissions.map(commission => 
        commissionService.create({
          ...commission,
          packageId: newPackageId,
          status: 'PENDING',
          type: 'UPGRADE'
        })
      ));

      res.json({
        success: true,
        message: 'Package upgrade initiated',
        data: {
          upgrade,
          newPackage
        }
      });

    } catch (error) {
      console.error('Upgrade package error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing package upgrade'
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
      const node = await nodeService.findByUserId(userId);
      
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found for user'
        });
      }

      const upgrades = await nodePackageService.findByNodeId(node.id, {
        isUpgrade: true,
        includePackages: true
      });

      res.json({
        success: true,
        data: upgrades
      });

    } catch (error) {
      console.error('Get upgrade history error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving upgrade history'
      });
    }
  }
}

module.exports = new PackageController();
