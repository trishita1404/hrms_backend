const express = require('express');
const router = express.Router();
const { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead 
} = require('../controller/notificationController');



const { protect } = require('../middleware/authMiddleware');

// 1. Get all notifications for the logged-in user

router.get('/', protect, getMyNotifications);

// 2. Mark all notifications as read

router.put('/read-all', protect, markAllAsRead);

// 3. Mark a single notification as read

router.patch('/:id/read', protect, markAsRead);

module.exports = router;