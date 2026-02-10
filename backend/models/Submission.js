const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  // Submission content
  textSubmission: { type: String },
  fileSubmissions: [{ fileName: String, fileUrl: String }],
  
  // Status tracking
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'resubmit'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  
  // Retry logic
  attemptNumber: { type: Number, default: 1, min: 1, max: 3 },
  canRetryAfter: { type: Date },
  
  // Evaluation
  marksAwarded: { type: Number },
  feedback: { type: String },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evaluatedAt: { type: Date }
});

// Allow multiple attempts per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
