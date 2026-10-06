const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { maskSensitiveData } = require('../middleware/privacyMiddleware');

// Public Identity Routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// Protected Profile Route (Applies QA Issue #7 Data Masking)
router.get('/profile', protect, maskSensitiveData, getProfile);

// Admin-Only Account Management Routes
router.route('/users')
  .get(protect, authorize('ADMIN'), getAllUsers);

router.route('/users/:id')
  .put(protect, authorize('ADMIN'), updateUser)
  .delete(protect, authorize('ADMIN'), deleteUser);

module.exports = router;