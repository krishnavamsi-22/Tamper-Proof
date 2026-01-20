const mongoose = require('mongoose');
const User = require('./models/User');

async function checkTeacher() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/tamper-lms');
    console.log('Connected to MongoDB\n');

    // Check all users
    const allUsers = await User.find({});
    console.log('=== ALL USERS ===');
    allUsers.forEach(u => {
      console.log(`${u.role.toUpperCase()}: ${u.email}`);
      console.log(`  Wallet: ${u.walletAddress || 'NOT SET'}`);
      console.log('');
    });

    // Check teacher specifically
    const teacher = await User.findOne({ role: 'teacher' });
    if (teacher) {
      console.log('=== TEACHER FOUND ===');
      console.log('Email:', teacher.email);
      console.log('Name:', teacher.name);
      console.log('Wallet:', teacher.walletAddress);
      console.log('');
      
      if (!teacher.walletAddress) {
        console.log('❌ Teacher has NO wallet address!');
        console.log('💡 Register teacher from Admin Dashboard with wallet address');
      } else {
        console.log('✅ Teacher wallet is set');
        console.log('\n🧪 Test teacher login:');
        console.log(`   1. Switch MetaMask to: ${teacher.walletAddress}`);
        console.log('   2. Go to: http://localhost:3000/admin');
        console.log('   3. Should show Teacher Dashboard');
      }
    } else {
      console.log('❌ No teacher found in database');
      console.log('💡 Register teacher from Admin Dashboard first');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTeacher();
