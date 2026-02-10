const express = require('express');
const multer = require('multer');
const path = require('path');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|txt|jpg|jpeg|png|zip/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    allowed.test(ext) ? cb(null, true) : cb(new Error('Invalid file type'));
  }
});

// Create assignment (teacher only)
router.post('/', auth, requireRole('teacher'), async (req, res) => {
  try {
    const { courseId, title, description, instructions, dueDate, difficulty, totalMarks, 
            submissionFormat, allowLateSubmission, latePenaltyPercent, rubric, passingMarks } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    // Check subject match
    if (req.user.subject.toLowerCase() !== course.subject.toLowerCase()) {
      return res.status(403).json({ error: 'Can only create assignments for your subject' });
    }

    const assignment = new Assignment({
      courseId, title, description, instructions, dueDate, difficulty, totalMarks,
      submissionFormat, allowLateSubmission, latePenaltyPercent, rubric, passingMarks,
      createdBy: req.user._id
    });
    
    await assignment.save();
    
    // Update course assignment count and state
    course.assignmentCount += 1;
    if (course.assignmentCount > 0 && course.state === 'draft') {
      course.state = 'published';
    }
    await course.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get assignments for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId })
      .populate('createdBy', 'name');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload files for assignment
router.post('/:id/upload', auth, requireRole('student'), upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files.map(f => ({ fileName: f.originalname, fileUrl: `/uploads/${f.filename}` }));
    res.json({ files });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit assignment (student only)
router.post('/:id/submit', auth, requireRole('student'), async (req, res) => {
  try {
    const { textSubmission, fileSubmissions } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Check if course content is completed
    const enrollment = await Enrollment.findOne({ 
      studentId: req.user._id, 
      courseId: assignment.courseId 
    }).populate('courseId');
    
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' });
    
    const totalLessons = enrollment.courseId.lessons.length;
    if (enrollment.completedLessons.length < totalLessons) {
      return res.status(403).json({ error: 'Complete all course content first' });
    }

    // Check existing submissions
    const existingSubmissions = await Submission.find({
      assignmentId: req.params.id,
      studentId: req.user._id
    }).sort({ attemptNumber: -1 });

    let attemptNumber = 1;
    let canRetryAfter = null;

    if (existingSubmissions.length > 0) {
      const lastSubmission = existingSubmissions[0];
      
      // Check if max attempts reached
      if (lastSubmission.attemptNumber >= 3) {
        return res.status(400).json({ error: 'Maximum attempts (3) reached for this assignment' });
      }

      // Check if last submission was evaluated
      if (lastSubmission.status === 'pending') {
        return res.status(400).json({ error: 'Previous submission is being evaluated' });
      }

      // Check if last submission passed
      if (lastSubmission.status === 'approved' && lastSubmission.marksAwarded >= assignment.passingMarks) {
        return res.status(400).json({ error: 'Assignment already passed' });
      }

      // Check cooldown period (8 hours)
      if (lastSubmission.canRetryAfter && new Date() < new Date(lastSubmission.canRetryAfter)) {
        const hoursLeft = Math.ceil((new Date(lastSubmission.canRetryAfter) - new Date()) / (1000 * 60 * 60));
        return res.status(400).json({ 
          error: `Please wait ${hoursLeft} hours before retrying`,
          canRetryAfter: lastSubmission.canRetryAfter
        });
      }

      attemptNumber = lastSubmission.attemptNumber + 1;
    }

    // Set retry cooldown (8 hours from now)
    canRetryAfter = new Date(Date.now() + 8 * 60 * 60 * 1000);

    // Check late submission
    const isLate = new Date() > new Date(assignment.dueDate);
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ error: 'Late submissions not allowed' });
    }

    const submission = new Submission({
      assignmentId: req.params.id,
      studentId: req.user._id,
      courseId: assignment.courseId,
      textSubmission,
      fileSubmissions,
      isLate,
      attemptNumber,
      canRetryAfter
    });
    
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending submissions (teacher only)
router.get('/submissions/pending', auth, requireRole('teacher'), async (req, res) => {
  try {
    const courses = await Course.find({ subject: req.user.subject });
    const courseIds = courses.map(c => c._id);
    
    const submissions = await Submission.find({ 
      courseId: { $in: courseIds },
      status: 'pending'
    })
    .populate('studentId', 'name email')
    .populate('assignmentId', 'title totalMarks')
    .populate('courseId', 'title');
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate submission (teacher only)
router.post('/submissions/:id/evaluate', auth, requireRole('teacher'), async (req, res) => {
  try {
    const { status, marksAwarded, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id)
      .populate('courseId')
      .populate('assignmentId');
    
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    
    // Check subject match
    if (req.user.subject.toLowerCase() !== submission.courseId.subject.toLowerCase()) {
      return res.status(403).json({ error: 'Can only evaluate your subject assignments' });
    }

    // Apply late penalty
    let finalMarks = marksAwarded;
    if (submission.isLate && submission.assignmentId.allowLateSubmission) {
      const penalty = (marksAwarded * submission.assignmentId.latePenaltyPercent) / 100;
      finalMarks = Math.max(0, marksAwarded - penalty);
    }

    submission.status = status;
    submission.marksAwarded = finalMarks;
    submission.feedback = feedback;
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();
    
    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student's submissions
router.get('/my-submissions', auth, requireRole('student'), async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user._id })
      .populate('assignmentId', 'title totalMarks dueDate passingMarks')
      .populate('courseId', 'title')
      .sort({ attemptNumber: 1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
