const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/tamper-lms';
const ADMIN_WALLET = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

async function updateAdminWallet() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user found. Run seed.js first.');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);
    console.log('Current wallet:', admin.walletAddress);

    // Update wallet address
    admin.walletAddress = ADMIN_WALLET;
    await admin.save();

    console.log('✅ Admin wallet updated to:', ADMIN_WALLET);
    console.log('\nYou can now access /admin with MetaMask Account #0');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateAdminWallet();
