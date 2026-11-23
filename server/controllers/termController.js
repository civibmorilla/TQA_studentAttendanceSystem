const Term = require('../models/Term');
const { logAudit } = require('../utils/audit');

const send500 = (res, e) => res.status(500).json({ success: false, message: e.message });

// @desc    All terms, newest first (any logged-in user; used for filters)
exports.getTerms = async (req, res) => {
  try {
    const terms = await Term.find().sort({ startDate: -1 });
    res.status(200).json({ success: true, data: terms, active: terms.find((t) => t.isActive) || null });
  } catch (e) { send500(res, e); }
};

const validateRange = (body) => {
  if (body.startDate && body.endDate && body.startDate > body.endDate) {
    return 'Start date must be before the end date.';
  }
  return null;
};

// @desc    Create a term (Admin). If isActive, it becomes the only active term.
exports.createTerm = async (req, res) => {
  try {
    const err = validateRange(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    if (req.body.isActive) await Term.updateMany({}, { isActive: false });
    const term = await Term.create(req.body);
    logAudit(req, 'term.create', { entity: 'Term', entityId: term._id, summary: `Created term ${term.name}` });
    res.status(201).json({ success: true, data: term });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// @desc    Update a term / set it active (Admin)
exports.updateTerm = async (req, res) => {
  try {
    const err = validateRange(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    if (req.body.isActive) await Term.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    const term = await Term.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!term) return res.status(404).json({ success: false, message: 'Term not found' });
    logAudit(req, 'term.update', { entity: 'Term', entityId: term._id, summary: `Updated term ${term.name}${req.body.isActive ? ' (now active)' : ''}` });
    res.status(200).json({ success: true, data: term });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// @desc    Delete a term (Admin). Attendance records are untouched.
exports.deleteTerm = async (req, res) => {
  try {
    const term = await Term.findByIdAndDelete(req.params.id);
    if (!term) return res.status(404).json({ success: false, message: 'Term not found' });
    logAudit(req, 'term.delete', { entity: 'Term', entityId: term._id, summary: `Deleted term ${term.name}` });
    res.status(200).json({ success: true, message: 'Term deleted' });
  } catch (e) { send500(res, e); }
};
