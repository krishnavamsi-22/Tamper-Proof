// Test admin wallet login API
const axios = require('axios');

async function testAdminLogin() {
  const walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  
  console.log('Testing admin wallet login...');
  console.log('Wallet:', walletAddress);
  console.log('');

  try {
    const response = await axios.post('http://localhost:5000/api/admin/wallet-login', {
      walletAddress: walletAddress
    });

    console.log('✅ SUCCESS!');
    console.log('User:', response.data.user);
    console.log('Token:', response.data.token.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error || error.message);
    console.log('');
    
    if (error.response?.status === 404) {
      console.log('💡 Solution: Admin user not found in database');
      console.log('   Run: node debug-admin.js');
    } else if (error.response?.status === 403) {
      console.log('💡 Solution: Wallet not whitelisted');
      console.log('   Check backend/.env has: ADMIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    }
  }
}

testAdminLogin();
