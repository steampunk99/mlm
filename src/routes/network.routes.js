const express = require('express');
const router = express.Router();
const { isActive } = require('../middleware/auth');
const networkController = require('../controllers/network.controller');

// Get direct referrals (sponsored users)
router.get('/referrals', isActive, networkController.getDirectReferrals);

// Get direct children in binary tree (left and right nodes)
router.get('/children', isActive, networkController.getDirectChildren);

// Get complete binary tree structure
router.get('/binary-tree', isActive, networkController.getBinaryTree);

// Get upline/genealogy
router.get('/genealogy', isActive, networkController.getGenealogy);

// Get network statistics
router.get('/stats', isActive, networkController.getNetworkStats);

module.exports = router;
