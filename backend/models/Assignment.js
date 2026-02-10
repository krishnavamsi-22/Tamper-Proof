const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String, required: true },
  dueDate: { type: Date, required: true },
  
  // Metadata
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  totalMarks: { type: Number, required: true },
  attachments: [{ fileName: String, fileUrl: String }],
  
  // Submission settings
  submissionFormat: { type: String, enum: ['text', 'file', 'both'], default: 'both' },
  allowLateSubmission: { type: Boolean, default: false },
  latePenaltyPercent: { type: Number, default: 0 },
  
  // Grading
  rubric: { type: String },
  passingMarks: { type: Number, required: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
