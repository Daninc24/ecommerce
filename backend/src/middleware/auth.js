const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Cookies:', req.cookies);
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
    
    const token = req.cookies.token;
    console.log('Token found:', !!token);
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', !!decoded);
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('User found:', !!user);
    console.log('User role:', user?.role);
    
    if (!user) {
      console.log('Invalid token - user not found');
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    console.log('Auth successful, proceeding...');
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const admin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Access denied.' });
  }
};

module.exports = { auth, admin }; 