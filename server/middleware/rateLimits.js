const rateLimit = require('express-rate-limit');

const json = (message) => ({ success: false, message });

// Stops password guessing: 10 failed logins per 15 minutes per IP + username.
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${String(req.body?.username || '').toLowerCase()}`,
  message: json('Too many failed login attempts. Please wait 15 minutes and try again.')
});

// Slows down mass account creation.
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Too many sign-ups from this network. Please try again later.')
});

// Stops brute-forcing the 6-character check-in code (per logged-in student).
exports.checkInLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: json('Too many check-in attempts. Wait a minute and scan the code on screen.')
});
