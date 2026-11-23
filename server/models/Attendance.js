const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { type: String, enum: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'], required: true },
  // How the record was created: manual toggle, student scanned the class QR,
  // or instructor scanned the student's ID QR
  method: { type: String, enum: ['MANUAL', 'QR_SESSION', 'QR_ID', 'AUTO_ABSENT'], default: 'MANUAL' },
  checkedInAt: { type: Date, default: null },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', default: null },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure a student can only have one attendance record per subject per day
AttendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
