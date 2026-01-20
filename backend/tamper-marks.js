require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function tamperMarks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find an enrollment with marks
    const enrollment = await Enrollment.findOne({ marks: { $exists: true } })
      .populate('studentId', 'name')
      .populate('courseId', 'title courseId');

    if (!enrollment) {
      console.log('❌ No enrollment with marks found');
      console.log('Please approve an enrollment first from Teacher Dashboard');
      return;
    }

    console.log('📊 BEFORE TAMPERING:');
    console.log('Student:', enrollment.studentId.name);
    console.log('Course:', enrollment.courseId.title);
    console.log('Original Marks:', enrollment.marks);
    console.log('Marks Hash:', enrollment.marksHash);
    console.log('');

    // Tamper the marks
    const originalMarks = enrollment.marks;
    const tamperedMarks = originalMarks + 10; // Increase by 10

    enrollment.marks = tamperedMarks;
    await enrollment.save();

    console.log('🔓 AFTER TAMPERING:');
    console.log('Tampered Marks:', enrollment.marks);
    console.log('Marks Hash (unchanged):', enrollment.marksHash);
    console.log('');

    console.log('⚠️  TAMPERING DETECTED:');
    console.log(`✅ Marks changed: ${originalMarks} → ${tamperedMarks}`);
    console.log('✅ But marksHash remains the same (points to original marks)');
    console.log('✅ When student verifies, blockchain will detect tampering!');
    console.log('');

    console.log('📝 Next Steps:');
    console.log('1. Login as student');
    console.log('2. Go to "My Courses" tab');
    console.log('3. Click "Verify on Blockchain" for marks');
    console.log('4. You will see: "❌ Marks have been tampered!"');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

tamperMarks();
