const ExcuseRequest = require('../models/ExcuseRequest');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { logAudit } = require('../utils/audit');

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// @desc    Student files an excuse letter for one class meeting
// @access  Private (Student)
exports.createExcuse = async (req, res) => {
  try {
    const { subjectId, date, reason } = req.body;
    if (!subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !String(reason || '').trim()) {
      return fail(res, 400, 'Subject, date and reason are required.');
    }
    if (String(reason).trim().length < 10) return fail(res, 400, 'Please explain the reason in at least 10 characters.');

    const student = await User.findById(req.user._id);
    const subject = await Subject.findById(subjectId);
    if (!subject) return fail(res, 404, 'Subject not found');
    const enrolled = (student.enrolledSubjects || []).some((id) => String(id) === String(subject._id));
    if (!enrolled) return fail(res, 403, 'You are not enrolled in this subject.');

    const dup = await ExcuseRequest.findOne({ student: student._id, subject: subject._id, date, status: { $in: ['PENDING', 'APPROVED'] } });
    if (dup) return fail(res, 400, `You already have a ${dup.status.toLowerCase()} excuse for that day.`);

    const excuse = await ExcuseRequest.create({ student: student._id, subject: subject._id, date, reason: String(reason).trim() });
    logAudit(req, 'excuse.create', { entity: 'ExcuseRequest', entityId: excuse._id, summary: `${student.userCustomId} filed an excuse for ${subject.code} on ${date}` });
    res.status(201).json({ success: true, data: excuse, message: 'Excuse letter sent to your instructor.' });
  } catch (e) { fail(res, 500, e.message); }
};

// @desc    The student's own excuse letters
// @access  Private (Student)
exports.getMyExcuses = async (req, res) => {
  try {
    const list = await ExcuseRequest.find({ student: req.user._id })
      .populate('subject', 'code title section')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (e) { fail(res, 500, e.message); }
};

// @desc    Excuse letters for the instructor's own classes (admin sees all)
// @access  Private (Instructor/Admin)
exports.getExcusesForReview = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (req.user.role === 'INSTRUCTOR') {
      const mySubjects = await Subject.find({ instructor: req.user._id }).select('_id');
      query.subject = { $in: mySubjects.map((s) => s._id) };
    }
    const list = await ExcuseRequest.find(query)
      .populate('student', 'fullName userCustomId section')
      .populate('subject', 'code title section')
      .populate('reviewedBy', 'fullName')
      .sort({ status: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (e) { fail(res, 500, e.message); }
};

// @desc    Approve or reject. Approving marks that day EXCUSED on the attendance sheet.
// @access  Private (Instructor of the subject / Admin)
exports.reviewExcuse = async (req, res) => {
  try {
    const { status, note = '' } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) return fail(res, 400, 'Status must be APPROVED or REJECTED.');

    const excuse = await ExcuseRequest.findById(req.params.id).populate('subject').populate('student', 'fullName userCustomId');
    if (!excuse) return fail(res, 404, 'Excuse request not found');
    if (req.user.role === 'INSTRUCTOR' && String(excuse.subject.instructor) !== String(req.user._id)) {
      return fail(res, 403, 'You can only review excuses for your own classes.');
    }

    excuse.status = status;
    excuse.reviewNote = String(note).slice(0, 500);
    excuse.reviewedBy = req.user._id;
    excuse.reviewedAt = new Date();
    await excuse.save();

    if (status === 'APPROVED') {
      await Attendance.findOneAndUpdate(
        { studentId: excuse.student._id, subjectId: excuse.subject._id, date: excuse.date },
        { $set: { status: 'EXCUSED', method: 'MANUAL', recordedBy: req.user._id } },
        { upsert: true }
      );
    }

    logAudit(req, `excuse.${status.toLowerCase()}`, {
      entity: 'ExcuseRequest', entityId: excuse._id,
      summary: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} excuse of ${excuse.student.userCustomId} for ${excuse.subject.code} on ${excuse.date}`
    });
    res.status(200).json({ success: true, data: excuse, message: `Excuse ${status.toLowerCase()}.` });
  } catch (e) { fail(res, 500, e.message); }
};
