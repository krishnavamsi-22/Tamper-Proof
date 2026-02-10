const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateData: { type: String, required: true }, // JSON metadata
  pdfData: { type: String, required: true }, // Base64 PDF
  certificateHash: { type: String, required: true }, // Hash of PDF
  issuedBy: { type: String }, // Admin wallet address
  issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
