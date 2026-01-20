const mongoose = require('mongoose');
const User = require('./models/User');

async function checkWallets() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/tamper-lms');
    
    const admin = await User.findOne({ role: 'admin' });
    console.log('Admin wallet in DB:', admin.walletAddress);
    console.log('Type:', typeof admin.walletAddress);
    console.log('Length:', admin.walletAddress?.length);
    
    // Test regex search
    const testWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    console.log('\nSearching for:', testWallet);
    
    const found = await User.findOne({ 
      walletAddress: { $regex: new RegExp(`^${testWallet}$`, 'i') },
      role: { $in: ['admin', 'teacher'] }
    });
    
    console.log('Found:', found ? `${found.role} - ${found.email}` : 'NOT FOUND');
    
    // Try exact lowercase match
    const foundLower = await User.findOne({ 
      walletAddress: testWallet.toLowerCase(),
      role: { $in: ['admin', 'teacher'] }
    });
    
    console.log('Found (lowercase):', foundLower ? `${foundLower.role} - ${foundLower.email}` : 'NOT FOUND');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWallets();
