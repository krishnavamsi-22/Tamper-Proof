const axios = require('axios');

async function testTeacherLogin() {
  const teacherWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  
  console.log('Testing teacher wallet login...');
  console.log('Wallet:', teacherWallet);
  console.log('');

  try {
    const response = await axios.post('http://localhost:5000/api/admin/wallet-login', {
      walletAddress: teacherWallet
    });

    console.log('✅ SUCCESS!');
    console.log('User:', response.data.user);
    console.log('Role:', response.data.user.role);
    console.log('Token:', response.data.token.substring(0, 20) + '...');
    console.log('');
    console.log('✅ Backend API works for teacher!');
    console.log('');
    console.log('Now test frontend:');
    console.log('1. Switch MetaMask to Account #1');
    console.log('2. Go to: http://localhost:3000/admin');
    console.log('3. Open browser console (F12)');
    console.log('4. Share any errors you see');
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error || error.message);
  }
}

testTeacherLogin();
