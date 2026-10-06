const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true }, // e.g., BSCpE
  name: { type: String, required: true, trim: true }, // e.g., Bachelor of Science in Computer Engineering
  yearLevels: { type: Number, default: 4, min: 1, max: 5 },
  sectionsCount: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Program', ProgramSchema);