const mongoose = require('mongoose');

// A live QR check-in window opened by an instructor for one subject on one day.
const AttendanceSessionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD (school timezone)
  startedAt: { type: Date, default: Date.now },
  lateAfterMinutes: { type: Number, default: 15, min: 0, max: 240 },
  expiresAt: { type: Date, required: true }, // check-ins rejected after this
  closedAt: { type: Date, default: null },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' }
}, { timestamps: true });

AttendanceSessionSchema.index({ subjectId: 1, date: 1, status: 1 });

AttendanceSessionSchema.methods.isAcceptingCheckIns = function () {
  return this.status === 'OPEN' && this.expiresAt > new Date();
};

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema);
