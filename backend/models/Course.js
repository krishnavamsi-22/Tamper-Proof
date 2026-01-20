const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  lessons: [{ title: String, content: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
