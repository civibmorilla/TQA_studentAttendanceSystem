const mongoose = require('mongoose');

// An academic term / semester. Attendance is filtered by the term's date range,
// so existing records work without any migration.
const TermSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },          // e.g. 1st Semester, AY 2026-2027
  startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Term', TermSchema);
