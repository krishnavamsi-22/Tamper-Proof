require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function tamperCertificate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a certificate
    const certificate = await Certificate.findOne()
      .populate('studentId', 'name')
      .populate('courseId', 'title');

    if (!certificate) {
      console.log('❌ No certificate found');
      console.log('Please issue a certificate first from Admin Dashboard');
      return;
    }

    const certData = JSON.parse(certificate.certificateData);

    console.log('🎓 BEFORE TAMPERING:');
    console.log('Student:', certData.studentName);
    console.log('Course:', certData.courseTitle);
    console.log('Marks in Certificate:', certData.marks);
    console.log('Marks Hash in Certificate:', certData.marksHash);
    console.log('Certificate Hash:', certificate.certificateHash);
    console.log('');

    // Tamper the certificate data
    const originalMarks = certData.marks;
    certData.marks = originalMarks + 15; // Increase marks

    certificate.certificateData = JSON.stringify(certData);
    await certificate.save();

    console.log('🔓 AFTER TAMPERING:');
    console.log('Tampered Marks:', certData.marks);
    console.log('Certificate Hash (unchanged):', certificate.certificateHash);
    console.log('');

    console.log('⚠️  TAMPERING DETECTED:');
    console.log(`✅ Certificate marks changed: ${originalMarks} → ${certData.marks}`);
    console.log('✅ But certificateHash remains the same');
    console.log('✅ When student verifies, blockchain will detect tampering!');
    console.log('');

    console.log('📝 Next Steps:');
    console.log('1. Login as student');
    console.log('2. Go to "Certificates" tab');
    console.log('3. Click "Verify on Blockchain"');
    console.log('4. You will see: "❌ Certificate has been tampered!"');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

tamperCertificate();
