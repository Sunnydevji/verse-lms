const express = require('express');
const Material = require('../models/Material');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes need authentication
router.use(protect);

// Get material by ID (accessible to both teachers and students)
router.get('/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    
    const material = await Material.findById(materialId)
      .populate('createdBy', 'name')
      .populate('subject');
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    // Check if user has access to this material
    if (req.user.role === 'student') {
      // For students, check if they belong to the class
      const subject = await Subject.findById(material.subject);
      
      if (!subject || !req.user.class.equals(subject.class)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this material'
        });
      }
    } else if (req.user.role === 'teacher') {
      // For teachers, check if they are assigned to the subject
      const subject = await Subject.findById(material.subject);
      
      if (!subject || !subject.teacher.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this material'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      material
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;