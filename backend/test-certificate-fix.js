require('dotenv').config();
const mongoose = require('mongoose');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function testCertificateFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find an enrollment with marks
    const enrollment = await Enrollment.findOne({ marks: { $exists: true } })
      .populate('studentId', 'name')
      .populate('courseId', 'title courseId');

    if (!enrollment) {
      console.log('❌ No enrollment with marks found');
      return;
    }

    console.log('📊 ENROLLMENT DATA:');
    console.log('Student:', enrollment.studentId.name);
    console.log('Course:', enrollment.courseId.title);
    console.log('Marks:', enrollment.marks);
    console.log('Marks Hash:', enrollment.marksHash);
    console.log('');

    // Find certificate
    const certificate = await Certificate.findOne({
      studentId: enrollment.studentId._id,
      courseId: enrollment.courseId._id
    });

    if (!certificate) {
      console.log('❌ No certificate found for this enrollment');
      return;
    }

    console.log('🎓 CERTIFICATE DATA:');
    const certData = JSON.parse(certificate.certificateData);
    console.log('Certificate Hash:', certificate.certificateHash);
    console.log('Marks in Certificate:', certData.marks);
    console.log('Marks Hash in Certificate:', certData.marksHash);
    console.log('');

    // Check if marksHash is linked
    if (certData.marksHash === enrollment.marksHash) {
      console.log('✅ FIXED: Certificate now includes marksHash!');
      console.log('✅ If marks are tampered in DB, certificate verification will fail');
    } else if (!certData.marksHash) {
      console.log('⚠️  OLD CERTIFICATE: No marksHash found');
      console.log('⚠️  Need to re-issue certificate to apply fix');
    } else {
      console.log('❌ MISMATCH: Certificate marksHash does not match enrollment');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testCertificateFix();
