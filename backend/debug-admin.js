const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/tamper-lms';
const ADMIN_WALLET = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

async function debugSetup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user found!');
      console.log('Run: node seed.js\n');
      process.exit(1);
    }

    console.log('📋 Admin User Details:');
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.name);
    console.log('  Role:', admin.role);
    console.log('  Wallet:', admin.walletAddress || 'NOT SET');
    console.log('');

    // Update wallet if needed
    if (admin.walletAddress?.toLowerCase() !== ADMIN_WALLET) {
      console.log('🔧 Updating admin wallet address...');
      admin.walletAddress = ADMIN_WALLET;
      await admin.save();
      console.log('✅ Wallet updated to:', ADMIN_WALLET);
    } else {
      console.log('✅ Wallet already correct');
    }

    console.log('\n📝 Environment Check:');
    console.log('  ADMIN_WALLET_ADDRESS in .env:', process.env.ADMIN_WALLET_ADDRESS || 'NOT SET');
    
    if (!process.env.ADMIN_WALLET_ADDRESS) {
      console.log('\n⚠️  WARNING: Add this to backend/.env:');
      console.log('  ADMIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    }

    console.log('\n🧪 Test Instructions:');
    console.log('1. Import wallet to MetaMask:');
    console.log('   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    console.log('2. Unlock MetaMask');
    console.log('3. Navigate to: http://localhost:3000/admin');
    console.log('4. Should auto-login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugSetup();
