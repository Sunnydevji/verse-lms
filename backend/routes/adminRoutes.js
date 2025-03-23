
const express = require('express');
const { 
  addTeacher,
  createClass,
  assignTeacherToClass,
  createSubject,
  getAllTeachers,
  getAllStudents,
  getAllClasses,
  downloadRecordsExcel
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

const router = express.Router();

// All routes need authentication and admin role
router.use(protect);
router.use(checkRole('admin'));

// Teacher management
router.post('/teachers', addTeacher);
router.get('/teachers', getAllTeachers);

// Class management
router.post('/classes', createClass);
router.put('/classes/:classId/assign-teacher', assignTeacherToClass);
router.get('/classes', getAllClasses);

// Subject management
router.post('/subjects', createSubject);

// Student management
router.get('/students', getAllStudents);

// Reports
router.get('/records/excel', downloadRecordsExcel);

module.exports = router;