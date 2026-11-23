const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token attached' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    // BUGFIX: a deleted user's token used to pass with req.user = null and crash later
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account no longer exists' });
    }
    // BUGFIX: deactivated accounts kept working until their 30-day token expired
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// RBAC Middleware: Restrict access to specific roles (e.g., ADMIN only)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Reads the token if present but never rejects. Used by /register so an admin
// can create staff accounts while the public can only create students.
exports.optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive !== false) req.user = user;
    } catch (e) { /* treat as anonymous */ }
  }
  next();
};
