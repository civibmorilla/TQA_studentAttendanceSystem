const mongoose = require('mongoose');

// A student's excuse letter for one class meeting, reviewed by the instructor.
const ExcuseRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '', maxlength: 500 }
}, { timestamps: true });

ExcuseRequestSchema.index({ student: 1, subject: 1, date: 1 });
ExcuseRequestSchema.index({ subject: 1, status: 1 });

module.exports = mongoose.model('ExcuseRequest', ExcuseRequestSchema);
