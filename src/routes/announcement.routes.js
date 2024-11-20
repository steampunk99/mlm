const express = require('express');
const router = express.Router();
const { isActive, isAdmin } = require('../middleware/auth');
const announcementController = require('../controllers/announcement.controller');

// User routes
router.get('/', isActive, announcementController.getAnnouncements);
router.get('/active', isActive, announcementController.getActiveAnnouncements);

// Admin routes
router.post('/', isAdmin, announcementController.createAnnouncement);
router.put('/:id', isAdmin, announcementController.updateAnnouncement);
router.delete('/:id', isAdmin, announcementController.deleteAnnouncement);

module.exports = router;
