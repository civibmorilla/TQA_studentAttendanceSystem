const express = require('express');
const router = express.Router();
const { createExcuse, getMyExcuses, getExcusesForReview, reviewExcuse } = require('../controllers/excuseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('STUDENT'), createExcuse);
router.get('/mine', protect, authorize('STUDENT'), getMyExcuses);
router.get('/review', protect, authorize('INSTRUCTOR', 'ADMIN'), getExcusesForReview);
router.patch('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), reviewExcuse);

module.exports = router;
