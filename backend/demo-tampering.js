const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

async function demonstrateTampering() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/tamper-lms');
    console.log('Connected to MongoDB\n');

    // Find an approved enrollment
    const enrollment = await Enrollment.findOne({ status: 'approved' })
      .populate('studentId')
      .populate('courseId');

    if (!enrollment) {
      console.log('❌ No approved enrollments found.');
      console.log('💡 Complete the flow first: Student → Enroll → Complete → Teacher Approve');
      process.exit(1);
    }

    console.log('=== ORIGINAL DATA ===');
    console.log('Student:', enrollment.studentId.name);
    console.log('Course:', enrollment.courseId.title);
    console.log('Original Marks:', enrollment.marks);
    console.log('Stored Hash:', enrollment.marksHash);
    console.log('');

    // Simulate tampering
    const originalMarks = enrollment.marks;
    const tamperedMarks = originalMarks + 10; // Increase marks by 10

    console.log('=== TAMPERING SIMULATION ===');
    console.log(`Changing marks from ${originalMarks} to ${tamperedMarks}...`);
    
    enrollment.marks = tamperedMarks;
    await enrollment.save();

    console.log('✅ Marks tampered in database!');
    console.log('');

    console.log('=== VERIFICATION ===');
    console.log('Now when student verifies marks:');
    console.log('');
    console.log('1. Frontend fetches marks from MongoDB:', tamperedMarks);
    console.log('2. Frontend calculates hash of tampered data');
    console.log('3. Frontend reads original hash from blockchain:', enrollment.marksHash);
    console.log('4. Frontend compares:');
    console.log('   - Calculated hash (from tampered data): DIFFERENT');
    console.log('   - Blockchain hash (original): ' + enrollment.marksHash.substring(0, 20) + '...');
    console.log('');
    console.log('❌ RESULT: Hashes DO NOT MATCH!');
    console.log('⚠️  WARNING: Data has been tampered!');
    console.log('');

    console.log('=== DEMO INSTRUCTIONS ===');
    console.log('1. Login as the student');
    console.log('2. Go to "My Enrollments"');
    console.log('3. Click "Verify Marks" button');
    console.log('4. You will see: "⚠️ TAMPER DETECTED!"');
    console.log('');

    console.log('=== RESTORE ORIGINAL ===');
    console.log('To restore original marks, run:');
    console.log(`  db.enrollments.updateOne({_id: ObjectId("${enrollment._id}")}, {$set: {marks: ${originalMarks}}})`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

demonstrateTampering();
