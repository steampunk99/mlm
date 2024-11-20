const { NodePackage, NodeChildren, Package } = require('../models');

/**
 * Calculate commissions for a package purchase
 * @param {number} packagePurchaseId 
 * @returns {Promise<Array>}
 */
async function calculateCommissions(packagePurchaseId) {
  const commissions = [];

  // Get package purchase details
  const packagePurchase = await NodePackage.findOne({
    where: { id: packagePurchaseId },
    include: [{ model: Package }]
  });

  if (!packagePurchase || !packagePurchase.is_paid) {
    return commissions;
  }

  // Get upline (genealogy)
  const genealogy = await getUpline(packagePurchase.node_id);
  
  // Calculate commissions based on levels
  for (let i = 0; i < genealogy.length; i++) {
    const uplineNode = genealogy[i];
    let commissionPercentage;

    // Set commission percentage based on level
    switch (i) {
      case 0: // Direct sponsor
        commissionPercentage = 0.10; // 10%
        break;
      case 1: // Level 2
        commissionPercentage = 0.05; // 5%
        break;
      case 2: // Level 3
        commissionPercentage = 0.03; // 3%
        break;
      case 3: // Level 4
        commissionPercentage = 0.02; // 2%
        break;
      default:
        commissionPercentage = 0.01; // 1% for deeper levels
    }

    const commissionAmount = packagePurchase.price * commissionPercentage;

    commissions.push({
      node_id: uplineNode.parent_node_id,
      node_position: uplineNode.parent_node_position,
      node_username: uplineNode.parent_node_username,
      amount: commissionAmount,
      reason: `Level ${i + 1} commission from ${packagePurchase.node_username}'s package purchase`
    });
  }

  // Calculate binary matching bonus
  const binaryBonus = await calculateBinaryBonus(packagePurchase);
  if (binaryBonus) {
    commissions.push(binaryBonus);
  }

  return commissions;
}

/**
 * Get upline nodes for commission calculation
 * @param {number} nodeId 
 * @returns {Promise<Array>}
 */
async function getUpline(nodeId) {
  const upline = [];
  let currentNodeId = nodeId;

  // Get up to 10 levels of upline
  for (let i = 0; i < 10; i++) {
    const node = await NodeChildren.findOne({
      where: {
        child_node_id: currentNodeId,
        is_deleted: false
      }
    });

    if (!node) break;

    upline.push(node);
    currentNodeId = node.parent_node_id;
  }

  return upline;
}

/**
 * Calculate binary matching bonus
 * @param {NodePackage} packagePurchase 
 * @returns {Promise<Object|null>}
 */
async function calculateBinaryBonus(packagePurchase) {
  try {
    const parent = await NodeChildren.findOne({
      where: {
        child_node_id: packagePurchase.node_id,
        is_deleted: false
      }
    });

    if (!parent) return null;

    // Get parent's children
    const siblings = await NodeChildren.findAll({
      where: {
        parent_node_id: parent.parent_node_id,
        is_deleted: false
      }
    });

    // Check if this completes a binary pair
    const leftChildren = siblings.filter(child => child.direction === 'L');
    const rightChildren = siblings.filter(child => child.direction === 'R');

    if (leftChildren.length > 0 && rightChildren.length > 0) {
      // Calculate binary matching bonus (e.g., 5% of package price)
      const bonusAmount = packagePurchase.price * 0.05;

      return {
        node_id: parent.parent_node_id,
        node_position: parent.parent_node_position,
        node_username: parent.parent_node_username,
        amount: bonusAmount,
        reason: `Binary matching bonus from ${packagePurchase.node_username}'s package purchase`
      };
    }

    return null;

  } catch (error) {
    console.error('Calculate binary bonus error:', error);
    return null;
  }
}

module.exports = {
  calculateCommissions
};
