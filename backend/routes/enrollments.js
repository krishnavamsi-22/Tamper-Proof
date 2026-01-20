const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { auth, requireRole } = require('../middleware/auth');
const { generateMarksHash } = require('../utils/hash');

const router = express.Router();

// Enroll in course
router.post('/', auth, requireRole('student'), async (req, res) => {
  try {
    const { courseId } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const existing = await Enrollment.findOne({ studentId: req.user._id, courseId });
    if (existing) return res.status(400).json({ error: 'Already enrolled' });

    const enrollment = new Enrollment({
      studentId: req.user._id,
      courseId,
      completedLessons: []
    });
    
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student enrollments
router.get('/my', auth, requireRole('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate('courseId');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete lesson
router.post('/:id/complete-lesson', auth, requireRole('student'), async (req, res) => {
  try {
    const { lessonIndex } = req.body;
    const enrollment = await Enrollment.findById(req.params.id).populate('courseId');
    
    if (!enrollment || enrollment.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (!enrollment.completedLessons.includes(lessonIndex)) {
      enrollment.completedLessons.push(lessonIndex);
      
      // Check if all lessons are completed
      const totalLessons = enrollment.courseId.lessons.length;
      if (enrollment.completedLessons.length === totalLessons) {
        enrollment.status = 'completed';
      }
      
      await enrollment.save();
    }

    res.json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve completion & generate marks (teacher only)
router.post('/:id/approve', auth, requireRole('teacher'), async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }
    
    const enrollment = await Enrollment.findById(req.params.id).populate('courseId');
    
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.status === 'approved') {
      return res.status(400).json({ error: 'Already approved' });
    }
    
    if (enrollment.status !== 'completed') {
      return res.status(400).json({ error: 'Student has not completed all lessons yet' });
    }

    // Check if teacher's subject matches course subject (case-insensitive)
    if (req.user.subject.toLowerCase() !== enrollment.courseId.subject.toLowerCase()) {
      return res.status(403).json({ error: 'You can only approve courses in your subject' });
    }

    // Auto-generate marks based on completion
    const totalLessons = enrollment.courseId.lessons.length;
    const completedCount = enrollment.completedLessons.length;
    const marks = Math.round((completedCount / totalLessons) * 100);

    // Generate hash
    const marksHash = generateMarksHash(
      enrollment.studentId.toString(),
      enrollment.courseId.courseId,
      marks
    );

    enrollment.status = 'approved';
    enrollment.marks = marks;
    enrollment.marksHash = marksHash;
    enrollment.approvedBy = walletAddress;
    enrollment.approvedAt = new Date();
    
    await enrollment.save();

    res.json({ enrollment, marksHash });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Store marks hash on blockchain (teacher only)
router.post('/:id/store-marks-blockchain', auth, requireRole('teacher'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title courseId');
    
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.status !== 'approved') {
      return res.status(400).json({ error: 'Enrollment not approved yet' });
    }
    if (!enrollment.marksHash) {
      return res.status(400).json({ error: 'Marks hash not generated' });
    }

    // Return data needed for blockchain transaction
    res.json({
      studentId: enrollment.studentId._id.toString(),
      courseId: enrollment.courseId.courseId,
      marksHash: enrollment.marksHash
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all enrollments (teacher/admin) - filtered by subject for teachers
router.get('/all', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    let enrollments = await Enrollment.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title courseId lessons subject');
    
    // Filter by teacher's subject (case-insensitive)
    if (req.user.role === 'teacher') {
      enrollments = enrollments.filter(e => 
        e.courseId.subject.toLowerCase() === req.user.subject.toLowerCase()
      );
    }
    
    console.log('Total enrollments:', enrollments.length);
    console.log('Completed enrollments:', enrollments.filter(e => e.status === 'completed').length);
    
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
