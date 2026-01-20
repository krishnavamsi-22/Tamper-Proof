const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: Number }],
  status: { type: String, enum: ['enrolled', 'completed', 'approved', 'verified'], default: 'enrolled' },
  marks: { type: Number },
  marksHash: { type: String },
  approvedBy: { type: String }, // Teacher wallet address
  approvedAt: { type: Date },
  enrolledAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
