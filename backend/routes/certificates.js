const express = require('express');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const { auth, requireRole } = require('../middleware/auth');
const { generateCertificateHash } = require('../utils/hash');

const router = express.Router();

// Generate certificate (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { enrollmentId, walletAddress } = req.body;
    
    if (!enrollmentId) {
      return res.status(400).json({ error: 'enrollmentId is required' });
    }
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }
    
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('studentId', 'name email')
      .populate('courseId', 'title courseId');
    
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.status !== 'approved') {
      return res.status(400).json({ error: 'Enrollment not approved yet' });
    }
    
    if (!enrollment.marks) {
      return res.status(400).json({ error: 'Marks not assigned yet' });
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({
      studentId: enrollment.studentId._id,
      courseId: enrollment.courseId._id
    });
    if (existing) return res.status(400).json({ error: 'Certificate already issued' });

    // Generate certificate data including marksHash for cryptographic linking
    const certificateData = JSON.stringify({
      studentName: enrollment.studentId.name,
      studentEmail: enrollment.studentId.email,
      courseTitle: enrollment.courseId.title,
      courseId: enrollment.courseId.courseId,
      marks: enrollment.marks,
      marksHash: enrollment.marksHash, // Link to marks hash
      issuedAt: new Date().toISOString()
    });

    const certificateHash = generateCertificateHash(certificateData);

    const certificate = new Certificate({
      studentId: enrollment.studentId._id,
      courseId: enrollment.courseId._id,
      certificateData,
      certificateHash,
      issuedBy: walletAddress
    });

    await certificate.save();
    
    // Update enrollment status to 'verified'
    enrollment.status = 'verified';
    await enrollment.save();
    
    res.status(201).json({ certificate, certificateHash });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all certificates (admin)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title courseId');
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student certificates
router.get('/my', auth, requireRole('student'), async (req, res) => {
  try {
    const certificates = await Certificate.find({ studentId: req.user._id })
      .populate('courseId', 'title courseId');
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get certificate by ID
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title courseId');
    
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
