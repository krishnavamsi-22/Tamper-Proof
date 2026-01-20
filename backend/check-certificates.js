require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function checkCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const certificates = await Certificate.find()
      .populate('studentId', 'name')
      .populate('courseId', 'title');

    console.log(`📊 Total Certificates: ${certificates.length}\n`);

    let oldFormat = 0;
    let newFormat = 0;

    certificates.forEach(cert => {
      const data = JSON.parse(cert.certificateData);
      const studentName = cert.studentId?.name || 'Unknown Student';
      const courseTitle = cert.courseId?.title || 'Unknown Course';
      
      if (data.marksHash) {
        newFormat++;
        console.log(`✅ ${studentName} - ${courseTitle} (NEW FORMAT)`);
      } else {
        oldFormat++;
        console.log(`⚠️  ${studentName} - ${courseTitle} (OLD FORMAT - needs re-issue)`);
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   New Format (Protected): ${newFormat}`);
    console.log(`   Old Format (Legacy): ${oldFormat}`);
    
    if (oldFormat > 0) {
      console.log(`\n⚠️  ${oldFormat} certificate(s) need to be re-issued for full protection`);
      console.log(`   Action: Delete old certificates and issue new ones from Admin Dashboard`);
    } else {
      console.log(`\n✅ All certificates have full tamper protection!`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkCertificates();
