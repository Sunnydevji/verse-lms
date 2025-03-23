const express = require('express');
const { 
  getTeacherClasses,
  getPendingStudents,
  updateStudentStatus,
  uploadMaterial,
  getSubjectStudents,
  getSubjectCommunications,
  replyToCommunication
} = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { fileUpload } = require('../config/cloudinary');

const router = express.Router();

// All routes need authentication and teacher role
router.use(protect);
router.use(checkRole('teacher', 'admin'));

// Class management
router.get('/classes', getTeacherClasses);

// Student management
router.get('/students/pending', getPendingStudents);
router.put('/students/:studentId/status', updateStudentStatus);

// Material management
router.post('/materials', fileUpload.single('file'), uploadMaterial);

// Subject management
router.get('/subjects/:subjectId/students', getSubjectStudents);
router.get('/subjects/:subjectId/communications', getSubjectCommunications);

// Communication
router.post('/communications/:communicationId/reply', replyToCommunication);

module.exports = router;