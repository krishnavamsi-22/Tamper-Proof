const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAdmin() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/tamper-lms');
    console.log('Connected to MongoDB\n');

    // Check all users
    const allUsers = await User.find({});
    console.log('Total users in database:', allUsers.length);
    console.log('');

    // Find admin
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user exists!');
      console.log('Creating admin user...\n');
      
      admin = new User({
        email: 'admin@tamper-lms.com',
        password: 'admin123',
        name: 'Admin',
        role: 'admin',
        walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
      });
      
      await admin.save();
      console.log('✅ Admin user created!');
    } else {
      console.log('Found admin user:');
      console.log('  ID:', admin._id);
      console.log('  Email:', admin.email);
      console.log('  Name:', admin.name);
      console.log('  Role:', admin.role);
      console.log('  Wallet:', admin.walletAddress || 'NOT SET');
      console.log('');
      
      // Update wallet
      admin.walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      await admin.save();
      console.log('✅ Wallet address updated!');
    }

    console.log('\nFinal admin details:');
    const updatedAdmin = await User.findOne({ role: 'admin' });
    console.log('  Email:', updatedAdmin.email);
    console.log('  Wallet:', updatedAdmin.walletAddress);
    console.log('');
    console.log('✅ Setup complete! Now test: node test-admin-login.js');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAdmin();
