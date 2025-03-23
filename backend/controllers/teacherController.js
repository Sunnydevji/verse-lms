const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Material = require('../models/Material');
const Communication = require('../models/Communication');

// @desc    Get teacher's assigned classes
// @route   GET /api/teachers/classes
// @access  Private/Teacher
exports.getTeacherClasses = async (req, res) => {
  try {
    // Find classes where this teacher is assigned
    const classes = await Class.find({ teachers: req.user._id });
    
    // Get subjects for each class
    const classesWithSubjects = await Promise.all(
      classes.map(async (classObj) => {
        const subjects = await Subject.find({ 
          class: classObj._id,
          teacher: req.user._id
        });
        
        return {
          ...classObj._doc,
          subjects
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: classes.length,
      classes: classesWithSubjects
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get pending student requests
// @route   GET /api/teachers/students/pending
// @access  Private/Teacher
exports.getPendingStudents = async (req, res) => {
  try {
    // Get all classes assigned to this teacher
    const teacherClasses = await Class.find({ teachers: req.user._id });
    const classIds = teacherClasses.map(c => c._id);
    
    // Find all pending students in these classes
    const pendingStudents = await User.find({
      role: 'student',
      status: 'pending',
      class: { $in: classIds }
    }).populate('class', 'name');
    
    res.status(200).json({
      success: true,
      count: pendingStudents.length,
      students: pendingStudents
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Approve or reject student
// @route   PUT /api/teachers/students/:studentId/status
// @access  Private/Teacher
exports.updateStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { studentId } = req.params;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }
    
    // Find the student
    const student = await User.findOne({ 
      _id: studentId, 
      role: 'student' 
    }).populate('class');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if teacher is assigned to student's class
    const isTeacherInClass = await Class.exists({
      _id: student.class._id,
      teachers: req.user._id
    });
    
    if (!isTeacherInClass) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve/reject this student'
      });
    }
    
    // Update student status
    student.status = status;
    await student.save();
    
    res.status(200).json({
      success: true,
      message: `Student ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      student
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Upload material (notes, video, audio)
// @route   POST /api/teachers/materials
// @access  Private/Teacher
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, description, type, subjectId } = req.body;
    
    // Check if subject exists and teacher is assigned to it
    const subject = await Subject.findOne({
      _id: subjectId,
      teacher: req.user._id
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or you are not assigned to this subject'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }
    
    // Create material
    const material = await Material.create({
      title,
      description,
      type,
      fileUrl: req.file.path,
      subject: subjectId,
      createdBy: req.user._id
    });
    
    // Notify all students in this class about the new material
    const classObj = await Class.findById(subject.class);
    const students = await User.find({
      role: 'student',
      status: 'approved',
      class: subject.class
    });
    
    // Create notifications for all students
    const notifications = students.map(student => ({
      sender: req.user._id,
      recipient: student._id,
      subject: subjectId,
      class: subject.class,
      message: `New ${type} material "${title}" added to ${subject.name}`
    }));
    
    if (notifications.length > 0) {
      await Communication.insertMany(notifications);
    }
    
    res.status(201).json({
      success: true,
      material,
      message: 'Material uploaded successfully and students notified'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get students in a subject
// @route   GET /api/teachers/subjects/:subjectId/students
// @access  Private/Teacher
exports.getSubjectStudents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Check if subject exists and teacher is assigned to it
    const subject = await Subject.findOne({
      _id: subjectId,
      teacher: req.user._id
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or you are not assigned to this subject'
      });
    }
    
    // Get all approved students in this class
    const students = await User.find({
      role: 'student',
      status: 'approved',
      class: subject.class
    }).select('-password');
    
    res.status(200).json({
      success: true,
      count: students.length,
      subject: subject.name,
      students
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get student queries for a subject
// @route   GET /api/teachers/subjects/:subjectId/communications
// @access  Private/Teacher
exports.getSubjectCommunications = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Check if subject exists and teacher is assigned to it
    const subject = await Subject.findOne({
      _id: subjectId,
      teacher: req.user._id
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or you are not assigned to this subject'
      });
    }
    
    // Get all communications for this subject
    const communications = await Communication.find({
      subject: subjectId,
      recipient: req.user._id
    })
    .populate('sender', 'name email profilePic')
    .sort('-createdAt');
    
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

// @desc    Reply to a student query
// @route   POST /api/teachers/communications/:communicationId/reply
// @access  Private/Teacher
exports.replyToCommunication = async (req, res) => {
  try {
    const { message } = req.body;
    const { communicationId } = req.params;
    
    // Find the original communication
    const originalCommunication = await Communication.findById(communicationId);
    
    if (!originalCommunication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }
    
    // Check if the teacher is the recipient of the original message
    if (!originalCommunication.recipient.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reply to this message'
      });
    }
    
    // Mark original communication as read
    originalCommunication.status = 'read';
    await originalCommunication.save();
    
    // Create reply
    const reply = await Communication.create({
      sender: req.user._id,
      recipient: originalCommunication.sender,
      subject: originalCommunication.subject,
      class: originalCommunication.class,
      message,
      parentCommunication: communicationId
    });
    
    res.status(201).json({
      success: true,
      reply,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};