const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateData: { type: String, required: true }, // Base64 PDF or JSON
  certificateHash: { type: String, required: true },
  issuedBy: { type: String }, // Admin wallet address
  issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
