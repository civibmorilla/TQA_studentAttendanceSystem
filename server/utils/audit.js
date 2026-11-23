const AuditLog = require('../models/AuditLog');

// Fire-and-forget: an audit failure must never break the real request.
exports.logAudit = (req, action, { entity = '', entityId = '', summary = '', details = {} } = {}) => {
  const user = req && req.user;
  AuditLog.create({
    actor: user ? user._id : null,
    actorName: user ? user.fullName : '',
    actorRole: user ? user.role : '',
    action,
    entity,
    entityId: entityId ? String(entityId) : '',
    summary,
    details,
    ip: (req && (req.ip || req.headers['x-forwarded-for'])) || ''
  }).catch((err) => console.error('Audit log failed:', err.message));
};
