require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function resetEnrollments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Reset all approved enrollments back to completed
    const result = await Enrollment.updateMany(
      { status: 'approved' },
      { 
        $set: { status: 'completed' },
        $unset: { marks: '', marksHash: '', approvedBy: '', approvedAt: '' }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} enrollment(s) to 'completed' status`);
    console.log(`\nNow you can:`);
    console.log(`1. Login as Teacher`);
    console.log(`2. Approve the enrollments again`);
    console.log(`3. New marks will include marksHash`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetEnrollments();
