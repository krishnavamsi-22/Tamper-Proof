const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register student
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ email, password, name, role: 'student' });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        walletAddress: user.walletAddress,
        subject: user.subject
      },
      token 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ 
    user: { 
      id: req.user._id, 
      email: req.user.email, 
      name: req.user.name, 
      role: req.user.role,
      walletAddress: req.user.walletAddress,
      subject: req.user.subject
    } 
  });
});

// MetaMask Admin Auto-Login (wallet-based authentication)
router.post('/admin-wallet-login', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Verify wallet matches admin whitelist
    const adminWallet = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase();
    if (walletAddress.toLowerCase() !== adminWallet) {
      return res.status(403).json({ error: 'Unauthorized wallet address' });
    }

    // Find or create admin user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found. Please contact system administrator.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Wallet not authorized for admin access' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        walletAddress: user.walletAddress,
        subject: user.subject
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
