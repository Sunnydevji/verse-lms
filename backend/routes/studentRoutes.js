const express = require('express');
const { 
  getStudentSubjects,
  getSubjectMaterials,
  sendQueryToTeacher,
  getNotifications,
  markNotificationAsRead,
  getCommunicationWithTeacher
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

const router = express.Router();

// All routes need authentication and student role
router.use(protect);
router.use(checkRole('student'));

// Subject management
router.get('/subjects', getStudentSubjects);
router.get('/subjects/:subjectId/materials', getSubjectMaterials);

// Communication
router.post('/subjects/:subjectId/query', sendQueryToTeacher);
router.get('/notifications', getNotifications);
router.put('/notifications/:notificationId', markNotificationAsRead);
router.get('/communications/:teacherId', getCommunicationWithTeacher);

module.exports = router;