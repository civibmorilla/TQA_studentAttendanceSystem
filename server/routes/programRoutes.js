const express = require('express');
const router = express.Router();
const { 
  createProgram, 
  getPrograms, 
  updateProgram,
  deleteProgram,
  createSubject, 
  getSubjects,
  createEnrollmentKey,
  getEnrollmentKeys,
  deleteEnrollmentKey,
  enrollWithKey,
  getMyEnrolledSubjects,
  assignStudentDirectly
} = require('../controllers/programController');

// Import authentication and authorization middleware from BE Dev 1
const { protect, authorize } = require('../middleware/authMiddleware');

// Program Routes
router.route('/programs')
  .get(protect, getPrograms)
  .post(protect, authorize('ADMIN'), createProgram);

router.route('/programs/:id')
  .put(protect, authorize('ADMIN'), updateProgram)
  .delete(protect, authorize('ADMIN'), deleteProgram);

// Subject Routes
router.route('/subjects')
  .get(protect, getSubjects)
  .post(protect, authorize('ADMIN'), createSubject);

// Enrollment Keys Routes (Admin)
router.route('/enrollment-keys')
  .get(protect, authorize('ADMIN'), getEnrollmentKeys)
  .post(protect, authorize('ADMIN'), createEnrollmentKey);

router.route('/enrollment-keys/:id')
  .delete(protect, authorize('ADMIN'), deleteEnrollmentKey);

router.post('/assign-student', protect, authorize('ADMIN'), assignStudentDirectly);

// Student Self-Enrollment Routes
router.post('/enroll-with-key', protect, authorize('STUDENT'), enrollWithKey);
router.get('/my-enrolled-subjects', protect, authorize('STUDENT'), getMyEnrolledSubjects);

module.exports = router;