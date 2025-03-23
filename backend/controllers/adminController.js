const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const excel = require('exceljs');

// @desc    Add teacher
// @route   POST /api/admin/teachers
// @access  Private/Admin
exports.addTeacher = async (req, res) => {
  try {
    const { name, email, password, contactNo } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }
    
    // Create teacher
    const teacher = await User.create({
      name,
      email,
      password,
      contactNo,
      role: 'teacher',
      status: 'approved'
    });
    
    res.status(201).json({
      success: true,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        contactNo: teacher.contactNo
      }
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create a class
// @route   POST /api/admin/classes
// @access  Private/Admin
exports.createClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if class already exists
    const classExists = await Class.findOne({ name });
    if (classExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class already exists with this name' 
      });
    }
    
    // Create class
    const newClass = await Class.create({
      name,
      description
    });
    
    res.status(201).json({
      success: true,
      class: newClass
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Assign teacher to class
// @route   PUT /api/admin/classes/:classId/assign-teacher
// @access  Private/Admin
exports.assignTeacherToClass = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const { classId } = req.params;
    
    // Check if class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    // Check if teacher exists and is a teacher
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }
    
    // Check if teacher is already assigned to this class
    if (classObj.teachers.includes(teacherId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher is already assigned to this class' 
      });
    }
    
    // Add teacher to class
    classObj.teachers.push(teacherId);
    await classObj.save();
    
    res.status(200).json({
      success: true,
      message: 'Teacher assigned to class successfully',
      class: classObj
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create subject and assign to class and teacher
// @route   POST /api/admin/subjects
// @access  Private/Admin
exports.createSubject = async (req, res) => {
  try {
    const { name, description, classId, teacherId } = req.body;
    
    // Check if class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    // Check if teacher exists and is a teacher
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }
    
    // Check if teacher is assigned to this class
    if (!classObj.teachers.includes(teacherId)) {
      // Assign teacher to class if not already assigned
      classObj.teachers.push(teacherId);
      await classObj.save();
    }
    
    // Check if subject already exists for this class
    const subjectExists = await Subject.findOne({ name, class: classId });
    if (subjectExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject already exists for this class' 
      });
    }
    
    // Create subject
    const subject = await Subject.create({
      name,
      description,
      class: classId,
      teacher: teacherId
    });
    
    res.status(201).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private/Admin
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    
    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('class', 'name');
    
    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all classes with subjects and teachers
// @route   GET /api/admin/classes
// @access  Private/Admin
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('teachers', 'name email');
    
    // Get subjects for each class
    const classesWithSubjects = await Promise.all(
      classes.map(async (classObj) => {
        const subjects = await Subject.find({ class: classObj._id })
          .populate('teacher', 'name email');
        
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

// @desc    Download all records in Excel format
// @route   GET /api/admin/records/excel
// @access  Private/Admin
exports.downloadRecordsExcel = async (req, res) => {
  try {
    // Fetch all data
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('class', 'name');
    const classes = await Class.find().populate('teachers', 'name');
    const subjects = await Subject.find()
      .populate('class', 'name')
      .populate('teacher', 'name');
    
    // Create a new Excel workbook
    const workbook = new excel.Workbook();
    
    // Add teachers worksheet
    const teachersSheet = workbook.addWorksheet('Teachers');
    teachersSheet.columns = [
      { header: 'ID', key: '_id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Contact', key: 'contactNo', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    teachersSheet.addRows(teachers);
    
    // Add students worksheet
    const studentsSheet = workbook.addWorksheet('Students');
    studentsSheet.columns = [
      { header: 'ID', key: '_id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Contact', key: 'contactNo', width: 20 },
      { header: 'Roll No', key: 'rollNo', width: 15 },
      { header: 'Class', key: 'className', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    // Format student data to include class name
    const formattedStudents = students.map(student => ({
      ...student._doc,
      className: student.class ? student.class.name : 'Not Assigned'
    }));
    studentsSheet.addRows(formattedStudents);
    
    // Add classes worksheet
    const classesSheet = workbook.addWorksheet('Classes');
    classesSheet.columns = [
      { header: 'ID', key: '_id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Teachers', key: 'teacherNames', width: 50 }
    ];
    
    // Format class data to include teacher names
    const formattedClasses = classes.map(classObj => ({
      ...classObj._doc,
      teacherNames: classObj.teachers.map(t => t.name).join(', ')
    }));
    classesSheet.addRows(formattedClasses);
    
    // Add subjects worksheet
    const subjectsSheet = workbook.addWorksheet('Subjects');
    subjectsSheet.columns = [
      { header: 'ID', key: '_id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Class', key: 'className', width: 20 },
      { header: 'Teacher', key: 'teacherName', width: 30 }
    ];
    
    // Format subject data
    const formattedSubjects = subjects.map(subject => ({
      ...subject._doc,
      className: subject.class ? subject.class.name : 'Not Assigned',
      teacherName: subject.teacher ? subject.teacher.name : 'Not Assigned'
    }));
    subjectsSheet.addRows(formattedSubjects);
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=lms-records.xlsx'
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};