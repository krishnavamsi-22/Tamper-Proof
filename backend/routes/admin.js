const express = require('express');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { adminWalletAuth } = require('../middleware/adminWalletAuth');

const router = express.Router();

// Admin wallet login (MetaMask auto-login)
router.post('/wallet-login', adminWalletAuth);

// Register teacher (admin only)
router.post('/register-teacher', auth, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, walletAddress, subject } = req.body;
    
    console.log('Register teacher request:', { email, name, walletAddress, subject });
    
    if (!email || !password || !name || !walletAddress || !subject) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const existingWallet = await User.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet address already registered' });
    }

    const teacher = new User({
      email,
      password,
      name,
      role: 'teacher',
      walletAddress,
      subject
    });
    
    await teacher.save();
    console.log('Teacher registered successfully:', teacher._id);
    
    res.status(201).json({ 
      teacher: { 
        id: teacher._id, 
        email: teacher.email, 
        name: teacher.name, 
        role: teacher.role,
        walletAddress: teacher.walletAddress,
        subject: teacher.subject
      } 
    });
  } catch (error) {
    console.error('Register teacher error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all teachers
router.get('/teachers', auth, requireRole('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
