const mongoose = require('mongoose');

// Who changed what, and when. Schools are expected to be able to show this
// for anything that affects a student's record.
const AuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorName: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  action: { type: String, required: true }, // e.g. attendance.save_sheet
  entity: { type: String, default: '' },    // e.g. Subject, User, Term
  entityId: { type: String, default: '' },
  summary: { type: String, default: '' },   // human-readable line
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
