const { Node, NodeStatement } = require('../models');

/**
 * Calculate and distribute commissions for a package purchase
 * @param {Node} user - The user who purchased the package
 * @param {Package} pkg - The package that was purchased
 * @param {Transaction} transaction - Sequelize transaction
 */
async function calculateCommissions(user, pkg, transaction) {
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
            await NodeStatement.create({
                node_id: sponsor.id,
                node_username: sponsor.username,
                node_position: sponsor.position,
                amount: commissionAmount,
                description: `Level ${level} commission from ${user.username}'s package purchase`,
                is_debit: false,
                is_credit: true,
                is_effective: true,
                event_date: new Date(),
                event_timestamp: new Date()
            }, { transaction });

            // Update sponsor's balance
            await sponsor.increment('current_balance', {
                by: commissionAmount,
                transaction
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
 * @returns {Promise<Node[]>} Array of sponsors
 */
async function getSponsorChain(userId, levels) {
    const sponsors = [];
    let currentUser = await Node.findByPk(userId);

    while (currentUser && sponsors.length < levels) {
        if (!currentUser.sponsor_node_id) break;

        const sponsor = await Node.findByPk(currentUser.sponsor_node_id);
        if (!sponsor || sponsor.is_deleted || sponsor.status !== 'active') break;

        sponsors.push(sponsor);
        currentUser = sponsor;
    }

    return sponsors;
}

module.exports = {
    calculateCommissions,
    getSponsorChain
};
