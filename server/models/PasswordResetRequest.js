const mongoose = require('mongoose');

// "Forgot password" request from the login page. An admin checks the person's
// identity, then resets the password from Accounts (which marks this RESOLVED).
const PasswordResetRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '', trim: true, maxlength: 300 },
  status: { type: String, enum: ['PENDING', 'RESOLVED', 'DISMISSED'], default: 'PENDING' },
  requestCount: { type: Number, default: 1 },
  lastRequestedAt: { type: Date, default: Date.now },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  handledAt: { type: Date, default: null },
  ip: { type: String, default: '' }
}, { timestamps: true });

PasswordResetRequestSchema.index({ user: 1, status: 1 });
PasswordResetRequestSchema.index({ status: 1, lastRequestedAt: -1 });

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
