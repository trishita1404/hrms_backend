const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  getUserProfile, 
  updateUserProfile, 
  updatePassword 
} = require('../controller/userController');

const { protect } = require('../middleware/authMiddleware'); 

// --- PUBLIC ROUTES ---
// Outsiders use this to register from the Landing Page
router.post('/register', registerUser); 

// --- PROTECTED ROUTES ---
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/change-password', protect, updatePassword);

module.exports = router;