const jwt = require('jsonwebtoken'); // ✅ Required
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader); // 👈 log

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  console.log("Extracted Token:", token); // 👈 log

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded); // 👈 log

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json ({ message: 'User not found' });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = { authMiddleware };