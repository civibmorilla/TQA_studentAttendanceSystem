const express = require('express');
const router = express.Router();
const { 
  saveDailyAttendance, 
  getClassAttendance, 
  getStudentStats,
  getStudentsBySection
} = require('../controllers/attendanceController');

// Import authentication middleware from BE Dev 1
const { protect, authorize } = require('../middleware/authMiddleware');

// Instructor Routes (Requires INSTRUCTOR role)
router.route('/class')
  .get(protect, authorize('INSTRUCTOR', 'ADMIN'), getClassAttendance)
  .post(protect, authorize('INSTRUCTOR', 'ADMIN'), saveDailyAttendance);

// Get students for roster building
router.get('/students', protect, authorize('INSTRUCTOR', 'ADMIN'), getStudentsBySection);

// Student Routes (Requires STUDENT role)
router.route('/my-stats')
  .get(protect, authorize('STUDENT'), getStudentStats);

module.exports = router;