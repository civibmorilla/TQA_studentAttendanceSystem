const express = require('express');
const router = express.Router();
const {
  saveDailyAttendance,
  getClassAttendance,
  getStudentStats,
  getStudentsBySection,
  startSession,
  getSessionLive,
  getActiveSessions,
  closeSession,
  checkIn,
  getMyQr,
  scanStudent,
  getSubjectReport,
  getClassSummaries,
  getIdCards
} = require('../controllers/attendanceController');
const { checkInLimiter } = require('../middleware/rateLimits');

const { protect, authorize } = require('../middleware/authMiddleware');

const staff = [protect, authorize('INSTRUCTOR', 'ADMIN')];
const student = [protect, authorize('STUDENT')];

// Manual attendance sheet
router.route('/class')
  .get(...staff, getClassAttendance)
  .post(...staff, saveDailyAttendance);

// Roster building (?subjectId=... preferred, ?section=... legacy)
router.get('/students', ...staff, getStudentsBySection);

// QR check-in sessions (instructor projects a rotating QR)
router.post('/sessions', ...staff, startSession);
router.get('/sessions/active', ...staff, getActiveSessions);
router.get('/sessions/:id', ...staff, getSessionLive);
router.post('/sessions/:id/close', ...staff, closeSession);

// Instructor scans a student's ID QR
router.post('/scan-student', ...staff, scanStudent);

// Reports / CSV export
router.get('/report', ...staff, getSubjectReport);
router.get('/summary', ...staff, getClassSummaries);
router.get('/id-cards', ...staff, getIdCards);

// Student routes
router.get('/my-stats', ...student, getStudentStats);
router.get('/my-qr', ...student, getMyQr);
router.post('/check-in', ...student, checkInLimiter, checkIn);

module.exports = router;
