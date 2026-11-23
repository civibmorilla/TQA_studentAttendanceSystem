const express = require('express');
const router = express.Router();
const { getTerms, createTerm, updateTerm, deleteTerm } = require('../controllers/termController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTerms)
  .post(protect, authorize('ADMIN'), createTerm);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateTerm)
  .delete(protect, authorize('ADMIN'), deleteTerm);

module.exports = router;
