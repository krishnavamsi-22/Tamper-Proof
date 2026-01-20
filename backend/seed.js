require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Certificate = require('./models/Certificate');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Certificate.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin (use Account #0 from Hardhat)
    const admin = new User({
      email: 'admin@tamper-lms.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    });
    await admin.save();
    console.log('✅ Created admin');

    console.log('\n📋 Admin Login Credentials:');
    console.log('Email: admin@tamper-lms.com');
    console.log('Password: admin123');
    console.log('Wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('\n🎯 Ready to login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
