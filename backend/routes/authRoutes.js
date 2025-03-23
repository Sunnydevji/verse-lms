const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { fileUpload } = require('../config/cloudinary');

const router = express.Router();

// Register user with profile pic upload
router.post('/register', fileUpload.single('profilePic'), registerUser);

// Login user
router.post('/login', loginUser);

// Get user profile (protected)
router.get('/me', protect, getUserProfile);

module.exports = router;