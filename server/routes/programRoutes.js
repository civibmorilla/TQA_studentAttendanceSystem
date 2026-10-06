const express = require('express');
const router = express.Router();
const { 
  createProgram, 
  getPrograms, 
  createSubject, 
  getSubjects 
} = require('../controllers/programController');

// Import authentication and authorization middleware from BE Dev 1
const { protect, authorize } = require('../middleware/authMiddleware');

// Program Routes
router.route('/programs')
  .get(protect, getPrograms)
  .post(protect, authorize('ADMIN'), createProgram);

// Subject Routes
router.route('/subjects')
  .get(protect, getSubjects)
  .post(protect, authorize('ADMIN'), createSubject);

module.exports = router;