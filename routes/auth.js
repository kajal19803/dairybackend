const express = require('express');
const { register, login, googleLogin } = require('../controllers/auth');
const jwt = require('jsonwebtoken');
const User = require ('../models/User');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// User contact info update route - PUT method recommended
router.put('/update-contact', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { phoneNumber, address } = req.body;

    if (!phoneNumber)
      return res.status(400).json ({ message: 'Phone number is required' });

    if (!address)
      return res.status(400).json({ message: 'Address is required' });

    // Update user document with new phone number and address
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { phoneNumber, address },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Contact info updated', user });
  } catch (err) {
    console.error('Update contact error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

