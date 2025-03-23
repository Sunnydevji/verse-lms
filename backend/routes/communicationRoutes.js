const express = require('express');
const Communication = require('../models/Communication');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes need authentication
router.use(protect);

// Get unread notifications count
router.get('/unread', async (req, res) => {
  try {
    const count = await Communication.countDocuments({
      recipient: req.user._id,
      status: 'unread'
    });
    
    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all communications
router.get('/', async (req, res) => {
  try {
    const communications = await Communication.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }