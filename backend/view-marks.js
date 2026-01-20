const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

async function viewMarks() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/tamper-lms');
    console.log('Connected to MongoDB\n');

    // Get all enrollments with marks
    const enrollments = await Enrollment.find({ marks: { $exists: true } })
      .populate('studentId', 'name email')
      .populate('courseId', 'title courseId');

    if (enrollments.length === 0) {
      console.log('❌ No marks found in database!');
      console.log('');
      console.log('💡 To generate marks:');
      console.log('1. Student enrolls in course');
      console.log('2. Student completes lessons');
      console.log('3. Teacher approves completion');
      console.log('4. Backend auto-generates marks');
      console.log('');
      process.exit(0);
    }

    console.log('=== MARKS IN DATABASE ===\n');
    
    enrollments.forEach((e, index) => {
      console.log(`${index + 1}. Student: ${e.studentId.name}`);
      console.log(`   Email: ${e.studentId.email}`);
      console.log(`   Course: ${e.courseId.title} (${e.courseId.courseId})`);
      console.log(`   Marks: ${e.marks}/100`);
      console.log(`   Status: ${e.status}`);
      console.log(`   Hash: ${e.marksHash || 'NOT SET'}`);
      console.log(`   Approved By: ${e.approvedBy || 'NOT SET'}`);
      console.log('');
    });

    console.log(`Total enrollments with marks: ${enrollments.length}`);
    console.log('');
    console.log('📊 Marks are stored in: MongoDB → enrollments collection → marks field');
    console.log('🔐 Hashes are stored in: Blockchain → marksHashes mapping');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

viewMarks();
