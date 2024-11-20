const { Node } = require('../models');
const { Op } = require('sequelize');

class NetworkController {
    /**
     * Get user's direct referrals (sponsored users)
     * @param {Request} req 
     * @param {Response} res 
     */
    async getDirectReferrals(req, res) {
        try {
            const userId = req.user.id;

            const referrals = await Node.findAll({
                where: {
                    sponsor_node_id: userId,
                    is_deleted: false
                },
                attributes: ['id', 'username', 'email', 'status', 'position', 'package_name', 'time_inserted']
            });

            res.json({
                success: true,
                data: referrals
            });

        } catch (error) {
            console.error('Get direct referrals error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get user's direct children in binary tree (left and right nodes)
     * @param {Request} req 
     * @param {Response} res 
     */
    async getDirectChildren(req, res) {
        try {
            const userId = req.user.id;

            const children = await Node.findAll({
                where: {
                    parent_node_id: userId,
                    is_deleted: false
                },
                attributes: ['id', 'username', 'email', 'status', 'position', 'direction', 'package_name', 'time_inserted']
            });

            const response = {
                left: children.find(child => child.direction === 'L') || null,
                right: children.find(child => child.direction === 'R') || null
            };

            res.json({
                success: true,
                data: response
            });

        } catch (error) {
            console.error('Get direct children error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get user's complete binary tree structure
     * @param {Request} req 
     * @param {Response} res 
     */
    async getBinaryTree(req, res) {
        try {
            const userId = req.user.id;
            const maxLevel = parseInt(req.query.maxLevel) || 3;

            async function getChildNodes(nodeId, level) {
                if (level >= maxLevel) return null;

                const children = await Node.findAll({
                    where: {
                        parent_node_id: nodeId,
                        is_deleted: false
                    },
                    attributes: ['id', 'username', 'email', 'status', 'position', 'direction', 'package_name', 'time_inserted']
                });

                const leftChild = children.find(child => child.direction === 'L');
                const rightChild = children.find(child => child.direction === 'R');

                return {
                    left: leftChild ? {
                        ...leftChild.toJSON(),
                        children: await getChildNodes(leftChild.id, level + 1)
                    } : null,
                    right: rightChild ? {
                        ...rightChild.toJSON(),
                        children: await getChildNodes(rightChild.id, level + 1)
                    } : null
                };
            }

            const rootUser = await Node.findByPk(userId, {
                attributes: ['id', 'username', 'email', 'status', 'position', 'package_name', 'time_inserted']
            });

            const binaryTree = {
                root: {
                    ...rootUser.toJSON(),
                    children: await getChildNodes(userId, 0)
                }
            };

            res.json({
                success: true,
                data: binaryTree
            });

        } catch (error) {
            console.error('Get binary tree error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get user's upline/genealogy
     * @param {Request} req 
     * @param {Response} res 
     */
    async getGenealogy(req, res) {
        try {
            const userId = req.user.id;
            const maxLevel = parseInt(req.query.maxLevel) || 10;
            const genealogy = [];

            let currentNode = await Node.findByPk(userId);

            while (currentNode && currentNode.parent_node_id && genealogy.length < maxLevel) {
                const parent = await Node.findByPk(currentNode.parent_node_id, {
                    attributes: ['id', 'username', 'email', 'status', 'position', 'package_name', 'time_inserted']
                });

                if (!parent || parent.is_deleted) break;

                genealogy.push({
                    level: genealogy.length + 1,
                    node: parent
                });

                currentNode = parent;
            }

            res.json({
                success: true,
                data: genealogy
            });

        } catch (error) {
            console.error('Get genealogy error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get network statistics
     * @param {Request} req 
     * @param {Response} res 
     */
    async getNetworkStats(req, res) {
        try {
            const userId = req.user.id;

            // Get direct referrals count
            const directReferralsCount = await Node.count({
                where: {
                    sponsor_node_id: userId,
                    is_deleted: false
                }
            });

            // Get left and right team counts
            const leftTeamCount = await this.getTeamCount(userId, 'L');
            const rightTeamCount = await this.getTeamCount(userId, 'R');

            // Get active package users in teams
            const activeLeftTeam = await this.getActiveTeamCount(userId, 'L');
            const activeRightTeam = await this.getActiveTeamCount(userId, 'R');

            res.json({
                success: true,
                data: {
                    direct_referrals: directReferralsCount,
                    left_team: {
                        total: leftTeamCount,
                        active: activeLeftTeam
                    },
                    right_team: {
                        total: rightTeamCount,
                        active: activeRightTeam
                    },
                    total_team: leftTeamCount + rightTeamCount
                }
            });

        } catch (error) {
            console.error('Get network stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Helper function to get team count for a direction
     * @param {number} userId 
     * @param {string} direction 
     * @returns {Promise<number>}
     */
    async getTeamCount(userId, direction) {
        const children = await Node.findAll({
            where: {
                parent_node_id: userId,
                direction,
                is_deleted: false
            }
        });

        let count = children.length;

        for (const child of children) {
            count += await this.getTeamCount(child.id, 'L');
            count += await this.getTeamCount(child.id, 'R');
        }

        return count;
    }

    /**
     * Helper function to get active team count for a direction
     * @param {number} userId 
     * @param {string} direction 
     * @returns {Promise<number>}
     */
    async getActiveTeamCount(userId, direction) {
        const children = await Node.findAll({
            where: {
                parent_node_id: userId,
                direction,
                status: 'active',
                is_deleted: false
            }
        });

        let count = children.length;

        for (const child of children) {
            count += await this.getActiveTeamCount(child.id, 'L');
            count += await this.getActiveTeamCount(child.id, 'R');
        }

        return count;
    }
}

module.exports = new NetworkController();
