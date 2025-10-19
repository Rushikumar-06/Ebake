const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in admin check.'
    });
  }
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
