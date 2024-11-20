const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodeChildrenService = require('../services/nodeChildren.service');
const notificationService = require('../services/notification.service');

class NetworkController {
    async getDirectReferrals(req, res) {
        try {
            const userId = req.user.id;

            const referrals = await nodeChildrenService.getDirectReferrals({
                userId
            });

            res.json({
                success: true,
                data: referrals
            });
        } catch (error) {
            console.error('Get direct referrals error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch direct referrals'
            });
        }
    }

    async getDirectChildren(req, res) {
        try {
            const userId = req.user.id;

            const children = await nodeChildrenService.getDirectChildren({
                userId
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
                error: 'Failed to fetch direct children'
            });
        }
    }

    async getBinaryTree(req, res) {
        try {
            const userId = req.user.id;
            const maxLevel = parseInt(req.query.maxLevel) || 3;

            const binaryTree = await nodeChildrenService.getBinaryTree({
                userId,
                maxLevel
            });

            res.json({
                success: true,
                data: binaryTree
            });
        } catch (error) {
            console.error('Get binary tree error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch binary tree'
            });
        }
    }

    async getGenealogy(req, res) {
        try {
            const userId = req.user.id;
            const maxLevel = parseInt(req.query.maxLevel) || 10;

            const genealogy = await nodeChildrenService.getGenealogy({
                userId,
                maxLevel
            });

            res.json({
                success: true,
                data: genealogy
            });
        } catch (error) {
            console.error('Get genealogy error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch genealogy'
            });
        }
    }

    async getNetworkStats(req, res) {
        try {
            const userId = req.user.id;

            const stats = await nodeChildrenService.getNetworkStats({
                userId
            });

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get network stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch network statistics'
            });
        }
    }

    async getTeamPerformance(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            const performance = await nodeChildrenService.getTeamPerformance({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            });

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            console.error('Get team performance error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch team performance'
            });
        }
    }

    async getGenealogyTree(req, res) {
        try {
            const userId = req.user.id;
            const { depth = 3 } = req.query;

            const genealogy = await nodeChildrenService.getGenealogyTree({
                userId,
                depth: parseInt(depth)
            });

            res.json({
                success: true,
                data: genealogy
            });
        } catch (error) {
            console.error('Get genealogy tree error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch genealogy tree'
            });
        }
    }

    async getBusinessVolume(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            const volume = await nodeChildrenService.getBusinessVolume({
                userId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            });

            res.json({
                success: true,
                data: volume
            });
        } catch (error) {
            console.error('Get business volume error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch business volume'
            });
        }
    }

    async getRankQualification(req, res) {
        try {
            const userId = req.user.id;
            const qualification = await nodeChildrenService.getRankQualification({
                userId
            });

            res.json({
                success: true,
                data: qualification
            });
        } catch (error) {
            console.error('Get rank qualification error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch rank qualification'
            });
        }
    }

    async getTeamStructure(req, res) {
        try {
            const userId = req.user.id;
            const { view = 'binary' } = req.query; // binary, unilevel, or matrix

            const structure = await nodeChildrenService.getTeamStructure({
                userId,
                view
            });

            res.json({
                success: true,
                data: structure
            });
        } catch (error) {
            console.error('Get team structure error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch team structure'
            });
        }
    }

    async searchNetwork(req, res) {
        try {
            const userId = req.user.id;
            const { query, type = 'username' } = req.query;

            const results = await nodeChildrenService.searchNetwork({
                userId,
                query,
                type
            });

            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            console.error('Search network error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search network'
            });
        }
    }
}

module.exports = new NetworkController();
