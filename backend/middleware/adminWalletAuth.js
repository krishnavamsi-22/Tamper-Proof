const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin/Teacher wallet authentication middleware
const adminWalletAuth = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    console.log('Wallet login attempt:', walletAddress);

    // Find user by wallet (case-insensitive search)
    const user = await User.findOne({ 
      walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') },
      role: { $in: ['admin', 'teacher'] }
    });
    
    console.log('User found:', user ? `${user.role} - ${user.email}` : 'NOT FOUND');
    
    if (!user) {
      return res.status(404).json({ error: 'Wallet not registered as admin or teacher' });
    }

    // Generate JWT
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
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { adminWalletAuth };
