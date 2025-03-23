const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Material = require('../models/Material');
const Communication = require('../models/Communication');

// @desc    Get student's class subjects
// @route   GET /api/students/subjects
// @access  Private/Student
exports.getStudentSubjects = async (req, res) => {
  try {
    // Check if student is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }
    
    // Get student's class
    const student = await User.findById(req.user._id).populate('class');
    
    if (!student.class) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any class'
      });
    }
    
    // Get all subjects for this class
    const subjects = await Subject.find({ class: student.class._id })
      .populate('teacher', 'name email');
    
    res.status(200).json({
      success: true,
      class: student.class.name,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get materials for a subject
// @route   GET /api/students/subjects/:subjectId/materials
// @access  Private/Student
exports.getSubjectMaterials = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Check if student is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }
    
    // Check if subject exists and is in student's class
    const subject = await Subject.findById(subjectId).populate('class');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    const student = await User.findById(req.user._id);
    
    if (!student.class.equals(subject.class._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this subject'
      });
    }
    
    // Get all materials for this subject
    const materials = await Material.find({ subject: subjectId })
      .populate('createdBy', 'name')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      subjectName: subject.name,
      count: materials.length,
      materials
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Send query to teacher
// @route   POST /api/students/subjects/:subjectId/query
// @access  Private/Student
exports.sendQueryToTeacher = async (req, res) => {
  try {
    const { message } = req.body;
    const { subjectId } = req.params;
    
    // Check if student is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }
    
    // Check if subject exists and is in student's class
    const subject = await Subject.findById(subjectId);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    const student = await User.findById(req.user._id);
    
    if (!student.class.equals(subject.class)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this subject'
      });
    }
    
    // Create communication (query)
    const communication = await Communication.create({
      sender: req.user._id,
      recipient: subject.teacher,
      subject: subjectId,
      class: student.class,
      message
    });
    
    res.status(201).json({
      success: true,
      communication,
      message: 'Query sent to teacher successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get notifications
// @route   GET /api/students/notifications
// @access  Private/Student
exports.getNotifications = async (req, res) => {
  try {
    // Check if student is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }
    
    // Get all notifications for this student
    const notifications = await Communication.find({
      recipient: req.user._id
    })
    .populate('sender', 'name role')
    .populate('subject', 'name')
    .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/students/notifications/:notificationId
// @access  Private/Student
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Find the notification
    const notification = await Communication.findOne({
      _id: notificationId,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Mark as read
    notification.status = 'read';
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get communication with teacher
// @route   GET /api/students/communications/:teacherId
// @access  Private/Student
exports.getCommunicationWithTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Check if student is approved
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval'
      });
    }
    
    // Get all communications between student and teacher
    const communications = await Communication.find({
      $or: [
        { sender: req.user._id, recipient: teacherId },
        { sender: teacherId, recipient: req.user._id }
      ]
    })
    .populate('sender', 'name role profilePic')
    .populate('recipient', 'name role')
    .populate('subject', 'name')
    .sort('createdAt');
    
    res.status(200).json({
      success: true,
      count: communications.length,
      communications
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};