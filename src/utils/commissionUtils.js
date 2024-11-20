const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate commissions for a package purchase
 * @param {number} packagePurchaseId 
 * @returns {Promise<Array>}
 */
async function calculateCommissions(packagePurchaseId) {
  const commissions = [];

  // Get package purchase details with package info
  const packagePurchase = await prisma.nodePackage.findUnique({
    where: { id: packagePurchaseId },
    include: {
      package: true,
      node: true
    }
  });

  if (!packagePurchase || !packagePurchase.isPaid) {
    return commissions;
  }

  // Get upline (genealogy)
  const genealogy = await getUpline(packagePurchase.nodeId);
  
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
      nodeId: uplineNode.parentNodeId,
      nodePosition: uplineNode.parentNodePosition,
      nodeUsername: uplineNode.parentNodeUsername,
      amount: commissionAmount,
      reason: `Level ${i + 1} commission from ${packagePurchase.node.username}'s package purchase`
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
    const node = await prisma.nodeChildren.findFirst({
      where: {
        childNodeId: currentNodeId,
        isDeleted: false
      },
      include: {
        parentNode: {
          select: {
            username: true
          }
        }
      }
    });

    if (!node) break;

    upline.push({
      ...node,
      parentNodeUsername: node.parentNode.username
    });
    currentNodeId = node.parentNodeId;
  }

  return upline;
}

/**
 * Calculate binary matching bonus
 * @param {Object} packagePurchase 
 * @returns {Promise<Object|null>}
 */
async function calculateBinaryBonus(packagePurchase) {
  try {
    const parent = await prisma.nodeChildren.findFirst({
      where: {
        childNodeId: packagePurchase.nodeId,
        isDeleted: false
      },
      include: {
        parentNode: true
      }
    });

    if (!parent) return null;

    // Get parent's left and right team volume
    const [leftVolume, rightVolume] = await Promise.all([
      calculateTeamVolume(parent.parentNodeId, 'LEFT'),
      calculateTeamVolume(parent.parentNodeId, 'RIGHT')
    ]);

    // Calculate matching bonus (10% of smaller leg)
    const matchingVolume = Math.min(leftVolume, rightVolume);
    const bonusAmount = matchingVolume * 0.10;

    if (bonusAmount <= 0) return null;

    return {
      nodeId: parent.parentNodeId,
      nodeUsername: parent.parentNode.username,
      amount: bonusAmount,
      reason: 'Binary matching bonus'
    };
  } catch (error) {
    console.error('Error calculating binary bonus:', error);
    return null;
  }
}

/**
 * Calculate team volume for binary bonus
 * @param {number} nodeId 
 * @param {string} position 
 * @returns {Promise<number>}
 */
async function calculateTeamVolume(nodeId, position) {
  const children = await prisma.nodeChildren.findMany({
    where: {
      parentNodeId: nodeId,
      parentNodePosition: position,
      isDeleted: false
    },
    include: {
      childNode: {
        include: {
          packages: {
            where: {
              isPaid: true
            },
            include: {
              package: true
            }
          }
        }
      }
    }
  });

  let volume = 0;
  for (const child of children) {
    volume += child.childNode.packages.reduce((sum, pkg) => sum + pkg.price, 0);
  }

  return volume;
}

module.exports = {
  calculateCommissions
};
