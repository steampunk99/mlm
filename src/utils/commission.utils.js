const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate and distribute commissions for a package purchase
 * @param {Object} user - The user who purchased the package
 * @param {Object} pkg - The package that was purchased
 * @param {Object} tx - Prisma transaction
 */
async function calculateCommissions(user, pkg, tx) {
    try {
        // Get sponsor chain (up to 10 levels)
        const sponsorChain = await getSponsorChain(user.id, 10);
        
        // Commission rates for each level (in percentage)
        const commissionRates = {
            1: 10, // Direct sponsor gets 10%
            2: 5,  // Level 2 sponsor gets 5%
            3: 3,  // Level 3 sponsor gets 3%
            4: 2,  // Level 4 sponsor gets 2%
            5: 1   // Level 5 sponsor gets 1%
        };

        // Distribute commissions to sponsors
        for (let i = 0; i < sponsorChain.length; i++) {
            const level = i + 1;
            const sponsor = sponsorChain[i];
            
            // Skip if no commission rate for this level
            if (!commissionRates[level]) continue;

            // Calculate commission amount
            const commissionRate = commissionRates[level];
            const commissionAmount = (pkg.price * commissionRate) / 100;

            // Create commission statement
            await tx.nodeStatement.create({
                data: {
                    nodeId: sponsor.id,
                    nodeUsername: sponsor.username,
                    nodePosition: sponsor.position,
                    amount: commissionAmount,
                    description: `Level ${level} commission from ${user.username}'s package purchase`,
                    isDebit: false,
                    isCredit: true,
                    isEffective: true,
                    eventDate: new Date(),
                    eventTimestamp: new Date()
                }
            });

            // Update sponsor's balance
            await tx.node.update({
                where: { id: sponsor.id },
                data: {
                    currentBalance: {
                        increment: commissionAmount
                    }
                }
            });
        }

    } catch (error) {
        console.error('Commission calculation error:', error);
        throw error;
    }
}

/**
 * Get the sponsor chain for a user up to specified levels
 * @param {number} userId - The user's ID
 * @param {number} levels - Number of levels to retrieve
 * @returns {Promise<Array>} Array of sponsors
 */
async function getSponsorChain(userId, levels) {
    const sponsors = [];
    let currentUser = await prisma.node.findUnique({
        where: { id: userId }
    });

    while (currentUser && sponsors.length < levels) {
        if (!currentUser.sponsorNodeId) break;

        const sponsor = await prisma.node.findFirst({
            where: {
                id: currentUser.sponsorNodeId,
                isDeleted: false,
                status: 'active'
            }
        });

        if (!sponsor) break;

        sponsors.push(sponsor);
        currentUser = sponsor;
    }

    return sponsors;
}

module.exports = {
    calculateCommissions,
    getSponsorChain
};
