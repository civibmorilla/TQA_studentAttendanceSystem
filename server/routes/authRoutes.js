const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  getDashboardStats,
  changeMyPassword,
  resetUserPassword,
  bulkImportStudents,
  getAuditLogs
} = require('../controllers/authController');
const {
  requestPasswordReset,
  getResetRequests,
  dismissResetRequest
} = require('../controllers/passwordResetController');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimits');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { maskSensitiveData } = require('../middleware/privacyMiddleware');

// Public Identity Routes
router.post('/login', loginLimiter, loginUser);
router.post('/register', registerLimiter, optionalAuth, registerUser);
router.post('/forgot-password', forgotPasswordLimiter, requestPasswordReset);

// Protected Profile Route (Applies QA Issue #7 Data Masking)
router.get('/profile', protect, maskSensitiveData, getProfile);

// Any logged-in user: change own password
router.put('/me/password', protect, changeMyPassword);

// Admin-Only Account Management Routes
router.post('/users/bulk', protect, authorize('ADMIN'), bulkImportStudents);
router.put('/users/:id/password', protect, authorize('ADMIN'), resetUserPassword);
router.get('/audit-logs', protect, authorize('ADMIN'), getAuditLogs);
router.get('/reset-requests', protect, authorize('ADMIN'), getResetRequests);
router.patch('/reset-requests/:id/dismiss', protect, authorize('ADMIN'), dismissResetRequest);
router.route('/users')
  .get(protect, authorize('ADMIN'), getAllUsers);

router.route('/users/:id')
  .put(protect, authorize('ADMIN'), updateUser)
  .delete(protect, authorize('ADMIN'), deleteUser);

// Admin Dashboard Stats Route
router.get('/dashboard-stats', protect, authorize('ADMIN'), getDashboardStats);

module.exports = router;