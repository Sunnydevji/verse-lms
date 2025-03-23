const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, contactNo, role, rollNo, classId } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }
    
    // Handle profile picture upload
    let profilePicUrl = '';
    if (req.file) {
      profilePicUrl = req.file.path;
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      contactNo,
      role: role || 'student',
      rollNo: role === 'student' ? rollNo : undefined,
      class: role === 'student' ? classId : undefined,
      profilePic: profilePicUrl || undefined,
      status: role === 'admin' || role === 'teacher' ? 'approved' : 'pending'
    });
    
    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for user email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if user is approved
    if (user.status !== 'approved' && user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Your account is pending approval' 
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNo: user.contactNo,
        role: user.role,
        profilePic: user.profilePic,
        status: user.status,
        rollNo: user.rollNo,
        class: user.class
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};