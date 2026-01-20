require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function deleteOldCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const certificates = await Certificate.find()
      .populate('studentId', 'name')
      .populate('courseId', 'title');

    let deleted = 0;

    for (const cert of certificates) {
      const data = JSON.parse(cert.certificateData);
      const studentName = cert.studentId?.name || 'Unknown Student';
      const courseTitle = cert.courseId?.title || 'Unknown Course';
      
      if (!data.marksHash) {
        console.log(`🗑️  Deleting old certificate: ${studentName} - ${courseTitle}`);
        await Certificate.findByIdAndDelete(cert._id);
        deleted++;
      }
    }

    console.log(`\n✅ Deleted ${deleted} old certificate(s)`);
    console.log(`\nNext steps:`);
    console.log(`1. Login as Admin`);
    console.log(`2. Go to "Issue Certificates" tab`);
    console.log(`3. Issue new certificates - they will have full protection`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

deleteOldCertificates();
