const express = require('express');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create course (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { courseId, title, description, subject, lessons } = req.body;
    
    const course = new Course({
      courseId,
      title,
      description,
      subject,
      lessons: lessons || [],
      createdBy: req.user._id
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all courses (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Teacher: only courses matching their subject
    if (req.user.role === 'teacher') {
      query = { subject: req.user.subject };
    }
    
    // Student: all courses (no filter)
    // Students can enroll in any course
    
    const courses = await Course.find(query).populate('createdBy', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
