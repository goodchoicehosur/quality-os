const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

// Verifies the Bearer token and attaches the authenticated user to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.active) {
      res.status(401);
      throw new Error('Not authorized. User no longer exists or is inactive.');
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized. Token failed verification.');
  }
});

// Restricts a route to a whitelist of roles. Admins retain full access.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || (req.user.role !== 'Admin' && !roles.includes(req.user.role))) {
    res.status(403);
    throw new Error(`Role '${req.user ? req.user.role : 'unknown'}' is not permitted to perform this action.`);
  }
  next();
};

module.exports = { protect, authorize };
