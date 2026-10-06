const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true }, // e.g., MATH-301
  title: { type: String, required: true, trim: true }, // e.g., Calculus
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  yearLevel: { type: String, required: true }, // e.g., 1st Year
  section: { type: String, required: true }, // e.g., BSCpE-101
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: { type: String, required: true }, // e.g., Mon/Wed 8:30 AM - 10:00 AM
  room: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);