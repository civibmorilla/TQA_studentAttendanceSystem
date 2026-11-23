const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Term = require('../models/Term');
const qr = require('../utils/qr');
const { logAudit } = require('../utils/audit');

const VALID_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];

// ---------------------------------------------------------------- helpers

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const sendError = (res, error) =>
  res.status(error.status || 500).json({ success: false, message: error.message });

// Instructors may only touch their own subjects; admins may touch any.
const loadManagedSubject = async (req, subjectId) => {
  if (!subjectId) throw new HttpError(400, 'subjectId is required');
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new HttpError(404, 'Subject not found');
  if (req.user.role === 'INSTRUCTOR' && String(subject.instructor) !== String(req.user._id)) {
    throw new HttpError(403, 'You are not the assigned instructor for this subject');
  }
  return subject;
};

// Students who belong to a subject: enrolled in it directly, or (legacy data)
// enrolled in the subject's section.
const rosterQueryFor = (subject) => ({
  role: 'STUDENT',
  isActive: { $ne: false },
  $or: [
    { enrolledSubjects: subject._id },
    { section: subject.section, isEnrolled: true }
  ]
});

const isStudentInSubject = (student, subject) =>
  (student.enrolledSubjects || []).some((id) => String(id) === String(subject._id)) ||
  (student.isEnrolled && student.section === subject.section);

const statusForSession = (session, at = new Date()) => {
  const lateAt = new Date(session.startedAt.getTime() + session.lateAfterMinutes * 60 * 1000);
  return at > lateAt ? 'LATE' : 'PRESENT';
};

const computeStats = (logs) => {
  const present = logs.filter((l) => l.status === 'PRESENT').length;
  const late = logs.filter((l) => l.status === 'LATE').length;
  const absent = logs.filter((l) => l.status === 'ABSENT').length;
  const excused = logs.filter((l) => l.status === 'EXCUSED').length;
  const total = present + late + absent; // excused days don't count against the student
  // Lates count as 0.5 (half-presence) for strict calculation
  const rate = total > 0 ? Number((((present + late * 0.5) / total) * 100).toFixed(1)) : 100.0;
  return { total, present, late, absent, excused, rate, isBelowTarget: rate < 80.0 };
};

// Date range from ?termId=... or ?from=YYYY-MM-DD&to=YYYY-MM-DD (both optional)
const resolveRange = async (query) => {
  if (query.termId) {
    const term = await Term.findById(query.termId).catch(() => null);
    if (!term) throw new HttpError(404, 'Term not found');
    return { from: term.startDate, to: term.endDate, term };
  }
  return { from: query.from || null, to: query.to || null, term: null };
};

const applyRange = (q, { from, to }) => {
  if (from || to) {
    q.date = {};
    if (from) q.date.$gte = from;
    if (to) q.date.$lte = to;
  }
  return q;
};

// ---------------------------------------------------------------- manual sheet

// @desc    Batch save or update daily attendance sheet
// @access  Private (Instructor of the subject / Admin)
exports.saveDailyAttendance = async (req, res) => {
  try {
    const { subjectId, date, roster } = req.body;
    await loadManagedSubject(req, subjectId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new HttpError(400, 'date must be YYYY-MM-DD');
    if (!Array.isArray(roster) || roster.length === 0) throw new HttpError(400, 'roster must be a non-empty array');

    const operations = roster.map((student) => {
      if (!VALID_STATUSES.includes(student.status)) {
        throw new HttpError(400, `Invalid status "${student.status}"`);
      }
      return {
        updateOne: {
          filter: { studentId: student.studentId, subjectId, date },
          update: { $set: { status: student.status, recordedBy: req.user._id }, $setOnInsert: { method: 'MANUAL' } },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(operations);
    const tally = roster.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
    logAudit(req, 'attendance.save_sheet', {
      entity: 'Subject', entityId: subjectId,
      summary: `Saved sheet for ${date}: ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(', ')}`,
      details: { date, count: roster.length }
    });
    res.status(200).json({ success: true, message: 'Attendance sheet saved successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get attendance sheet for a specific class and date
// @access  Private (Instructor of the subject / Admin)
exports.getClassAttendance = async (req, res) => {
  try {
    const { subjectId, date } = req.query;
    await loadManagedSubject(req, subjectId);

    const records = await Attendance.find({ subjectId, date })
      .populate('studentId', 'fullName userCustomId');

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Students who belong to a subject (preferred) or a section
// @access  Private (Instructor/Admin)
exports.getStudentsBySection = async (req, res) => {
  try {
    const { subjectId, section } = req.query;
    let query;
    if (subjectId) {
      const subject = await loadManagedSubject(req, subjectId);
      query = rosterQueryFor(subject);
    } else if (section) {
      query = { role: 'STUDENT', section, isEnrolled: true, isActive: { $ne: false } };
    } else {
      throw new HttpError(400, 'subjectId or section query parameter is required');
    }

    // BUGFIX: no more "fall back to every student in the school" when a section is empty
    const students = await User.find(query)
      .select('fullName userCustomId section')
      .sort({ fullName: 1 });

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    sendError(res, error);
  }
};

// ---------------------------------------------------------------- student stats

// @desc    Get personal attendance stats and timeline
// @access  Private (Student Only)
exports.getStudentStats = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student || !student.isEnrolled) {
      return res.status(200).json({
        success: true,
        isEnrolled: false,
        stats: computeStats([]),
        logs: []
      });
    }

    const { subjectId } = req.query; // Optional: filter by specific subject
    const range = await resolveRange(req.query); // Optional: ?termId= or ?from=&to=
    const query = applyRange({ studentId: student._id }, range);
    if (subjectId) {
      query.subjectId = subjectId;
    } else if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      query.subjectId = { $in: student.enrolledSubjects };
    }

    const logs = await Attendance.find(query)
      .populate('subjectId', 'title code')
      .sort({ date: -1 });

    res.status(200).json({ success: true, isEnrolled: true, stats: computeStats(logs), logs });
  } catch (error) {
    sendError(res, error);
  }
};

// ---------------------------------------------------------------- QR sessions (instructor shows QR, students scan)

const sessionView = async (session) => {
  const records = await Attendance.find({ sessionId: session._id })
    .populate('studentId', 'fullName userCustomId')
    .sort({ checkedInAt: -1 });
  const accepting = session.isAcceptingCheckIns();
  return {
    _id: session._id,
    subjectId: session.subjectId,
    date: session.date,
    status: accepting ? 'OPEN' : 'CLOSED',
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    closedAt: session.closedAt,
    lateAfterMinutes: session.lateAfterMinutes,
    lateAt: new Date(session.startedAt.getTime() + session.lateAfterMinutes * 60000),
    // Only expose the live code while the session is accepting check-ins
    code: accepting ? qr.sessionCode(session._id) : null,
    qrPayload: accepting ? qr.sessionPayload(session._id) : null,
    refreshInMs: qr.msUntilNextWindow(),
    checkIns: records.map((r) => ({
      _id: r._id,
      student: r.studentId,
      status: r.status,
      method: r.method,
      checkedInAt: r.checkedInAt
    }))
  };
};

// @desc    Open (or resume) today's QR check-in session for a subject
// @access  Private (Instructor of the subject / Admin)
exports.startSession = async (req, res) => {
  try {
    const { subjectId, lateAfterMinutes = 15, durationMinutes = 90 } = req.body;
    const subject = await loadManagedSubject(req, subjectId);
    const date = qr.todayLocal();

    // Resume an already-open session instead of creating duplicates
    let session = await AttendanceSession.findOne({ subjectId, date, status: 'OPEN', expiresAt: { $gt: new Date() } });
    if (!session) {
      const minutes = Math.min(Math.max(Number(durationMinutes) || 90, 5), 300);
      session = await AttendanceSession.create({
        subjectId,
        instructor: subject.instructor,
        date,
        lateAfterMinutes: Math.min(Math.max(Number(lateAfterMinutes) || 0, 0), 240),
        expiresAt: new Date(Date.now() + minutes * 60000)
      });
      logAudit(req, 'session.start', { entity: 'Subject', entityId: subjectId, summary: `Started QR check-in for ${subject.code} (${subject.section})` });
    }

    res.status(200).json({ success: true, data: await sessionView(session) });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Live view: current rotating code + who has checked in. Poll every few seconds.
// @access  Private (Instructor of the subject / Admin)
exports.getSessionLive = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) throw new HttpError(404, 'Session not found');
    await loadManagedSubject(req, session.subjectId);

    const view = await sessionView(session);
    const subject = await Subject.findById(session.subjectId);
    view.rosterSize = await User.countDocuments(rosterQueryFor(subject));
    res.status(200).json({ success: true, data: view });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Open sessions for the current instructor (to resume after a page refresh)
// @access  Private (Instructor/Admin)
exports.getActiveSessions = async (req, res) => {
  try {
    const query = { status: 'OPEN', expiresAt: { $gt: new Date() } };
    if (req.user.role === 'INSTRUCTOR') query.instructor = req.user._id;
    const sessions = await AttendanceSession.find(query).populate('subjectId', 'code title section');
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Close a session; optionally mark everyone who didn't check in as ABSENT
// @access  Private (Instructor of the subject / Admin)
exports.closeSession = async (req, res) => {
  try {
    const { markAbsent = true } = req.body || {};
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) throw new HttpError(404, 'Session not found');
    const subject = await loadManagedSubject(req, session.subjectId);

    session.status = 'CLOSED';
    session.closedAt = new Date();
    await session.save();

    let markedAbsent = 0;
    if (markAbsent) {
      const roster = await User.find(rosterQueryFor(subject)).select('_id');
      const existing = await Attendance.find({ subjectId: subject._id, date: session.date }).select('studentId');
      const seen = new Set(existing.map((r) => String(r.studentId)));
      const missing = roster.filter((s) => !seen.has(String(s._id)));
      if (missing.length) {
        await Attendance.insertMany(missing.map((s) => ({
          studentId: s._id,
          subjectId: subject._id,
          date: session.date,
          status: 'ABSENT',
          method: 'AUTO_ABSENT',
          sessionId: session._id,
          recordedBy: req.user._id
        })), { ordered: false });
      }
      markedAbsent = missing.length;
    }

    logAudit(req, 'session.close', {
      entity: 'Subject', entityId: subject._id,
      summary: `Closed QR check-in for ${subject.code} on ${session.date}; ${markedAbsent} marked absent`
    });
    res.status(200).json({
      success: true,
      message: `Session closed${markAbsent ? `, ${markedAbsent} student(s) marked absent` : ''}`,
      markedAbsent
    });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Student checks in by scanning the classroom QR (or typing the 6-char code)
// @access  Private (Student)
exports.checkIn = async (req, res) => {
  try {
    const parsed = qr.parsePayload(req.body.payload || req.body.code);
    if (!parsed || parsed.type === 'STUDENT') {
      throw new HttpError(400, 'That is not a class attendance QR code');
    }

    const student = await User.findById(req.user._id);
    if (!student || !student.isEnrolled) {
      throw new HttpError(403, 'You are not enrolled yet. Redeem your enrollment key first.');
    }

    // Find the session: from the QR payload, or by matching a typed code
    // against the open sessions of the student's own subjects.
    let session = null;
    if (parsed.type === 'SESSION') {
      session = await AttendanceSession.findById(parsed.id).catch(() => null);
      if (session && !qr.verifySessionCode(session._id, parsed.code)) {
        throw new HttpError(400, 'This QR code has expired. Scan the code currently on screen.');
      }
    } else {
      const candidates = await AttendanceSession.find({
        status: 'OPEN',
        expiresAt: { $gt: new Date() },
        date: qr.todayLocal()
      });
      session = candidates.find((s) => qr.verifySessionCode(s._id, parsed.code)) || null;
      if (!session) throw new HttpError(400, 'Code not recognised or already expired. Check the screen and try again.');
    }

    if (!session) throw new HttpError(404, 'Attendance session not found');
    if (!session.isAcceptingCheckIns()) throw new HttpError(400, 'This attendance session is already closed');

    const subject = await Subject.findById(session.subjectId);
    if (!subject || !isStudentInSubject(student, subject)) {
      throw new HttpError(403, 'You are not enrolled in this class');
    }

    const existing = await Attendance.findOne({ studentId: student._id, subjectId: subject._id, date: session.date });
    if (existing && existing.status !== 'ABSENT') {
      return res.status(200).json({
        success: true,
        alreadyCheckedIn: true,
        message: `You're already marked ${existing.status} for ${subject.code} today`,
        data: { status: existing.status, subject: { code: subject.code, title: subject.title }, checkedInAt: existing.checkedInAt }
      });
    }

    const now = new Date();
    const status = statusForSession(session, now);
    const record = await Attendance.findOneAndUpdate(
      { studentId: student._id, subjectId: subject._id, date: session.date },
      { $set: { status, method: 'QR_SESSION', checkedInAt: now, sessionId: session._id, recordedBy: student._id } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Checked in to ${subject.code} as ${status}`,
      data: { status: record.status, subject: { code: subject.code, title: subject.title }, checkedInAt: record.checkedInAt }
    });
  } catch (error) {
    sendError(res, error);
  }
};

// ---------------------------------------------------------------- Student ID QR (instructor scans the student)

// @desc    The student's personal signed QR ID
// @access  Private (Student)
exports.getMyQr = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      payload: qr.studentPayload(req.user._id),
      fullName: req.user.fullName,
      userCustomId: req.user.userCustomId
    }
  });
};

// @desc    Instructor scans a student's ID QR to mark them on the sheet
// @access  Private (Instructor of the subject / Admin)
exports.scanStudent = async (req, res) => {
  try {
    const { subjectId, date, payload, status } = req.body;
    const subject = await loadManagedSubject(req, subjectId);
    const parsed = qr.parsePayload(payload);
    if (!qr.verifyStudentPayload(parsed)) throw new HttpError(400, 'Not a valid student ID QR code');

    const student = await User.findById(parsed.id).catch(() => null);
    if (!student || student.role !== 'STUDENT') throw new HttpError(404, 'Student not found');
    if (student.isActive === false) throw new HttpError(403, `${student.fullName}'s account is deactivated`);
    if (!isStudentInSubject(student, subject)) {
      throw new HttpError(403, `${student.fullName} is not enrolled in ${subject.code}`);
    }

    const finalStatus = VALID_STATUSES.includes(status) ? status : 'PRESENT';
    const day = date || qr.todayLocal();
    await Attendance.findOneAndUpdate(
      { studentId: student._id, subjectId: subject._id, date: day },
      { $set: { status: finalStatus, method: 'QR_ID', checkedInAt: new Date(), recordedBy: req.user._id } },
      { upsert: true, new: true }
    );

    logAudit(req, 'attendance.scan_student', {
      entity: 'Subject', entityId: subject._id,
      summary: `Scanned ID of ${student.userCustomId} for ${subject.code} on ${day}: ${finalStatus}`
    });
    res.status(200).json({
      success: true,
      message: `${student.fullName} marked ${finalStatus}`,
      data: { studentId: student._id, fullName: student.fullName, userCustomId: student.userCustomId, status: finalStatus }
    });
  } catch (error) {
    sendError(res, error);
  }
};

// ---------------------------------------------------------------- reports

const buildReport = async (subject, range) => {
  const [students, records] = await Promise.all([
    User.find(rosterQueryFor(subject)).select('fullName userCustomId').sort({ fullName: 1 }),
    Attendance.find(applyRange({ subjectId: subject._id }, range)).select('studentId date status')
  ]);

  const dates = [...new Set(records.map((r) => r.date))].sort();
  const byStudent = {};
  records.forEach((r) => {
    const key = String(r.studentId);
    (byStudent[key] = byStudent[key] || []).push(r);
  });

  const rows = students.map((s) => {
    const logs = byStudent[String(s._id)] || [];
    const statusByDate = {};
    logs.forEach((l) => { statusByDate[l.date] = l.status; });
    return { studentId: s._id, fullName: s.fullName, userCustomId: s.userCustomId, statusByDate, stats: computeStats(logs) };
  });

  // Per-meeting turnout: share of the roster that was present or late
  const trend = dates.map((d) => {
    const dayRecords = records.filter((r) => r.date === d);
    const attended = dayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    return { date: d, attended, total: students.length, pct: students.length ? Math.round((attended / students.length) * 100) : 0 };
  });

  const withRecords = rows.filter((r) => r.stats.total > 0);
  const avgRate = withRecords.length
    ? Number((withRecords.reduce((a, r) => a + r.stats.rate, 0) / withRecords.length).toFixed(1))
    : null;

  return {
    subject: { _id: subject._id, code: subject.code, title: subject.title, section: subject.section, schedule: subject.schedule },
    dates,
    rows,
    trend,
    summary: {
      rosterSize: students.length,
      meetings: dates.length,
      avgRate,
      atRisk: withRecords.filter((r) => r.stats.isBelowTarget)
        .map((r) => ({ studentId: r.studentId, fullName: r.fullName, userCustomId: r.userCustomId, rate: r.stats.rate, absent: r.stats.absent }))
        .sort((a, b) => a.rate - b.rate)
    }
  };
};

// @desc    Full attendance matrix for one subject (CSV export, charts, at-risk list)
// @access  Private (Instructor of the subject / Admin)
// query:   subjectId, and optionally termId or from/to
exports.getSubjectReport = async (req, res) => {
  try {
    const subject = await loadManagedSubject(req, req.query.subjectId);
    const range = await resolveRange(req.query);
    const report = await buildReport(subject, range);
    report.term = range.term ? { _id: range.term._id, name: range.term.name } : null;
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    One summary card per class: roster, meetings held, average rate, at-risk students
// @access  Private (Instructor: own classes / Admin: all)
exports.getClassSummaries = async (req, res) => {
  try {
    const range = await resolveRange(req.query);
    const subjectQuery = req.user.role === 'INSTRUCTOR' ? { instructor: req.user._id } : {};
    const subjects = await Subject.find(subjectQuery).populate('instructor', 'fullName').sort({ code: 1 });
    const data = [];
    for (const subject of subjects) {
      // eslint-disable-next-line no-await-in-loop
      const report = await buildReport(subject, range);
      data.push({ subject: { ...report.subject, instructor: subject.instructor?.fullName || '' }, summary: report.summary });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Signed QR IDs for printing ID cards: ?subjectId= (its roster) or ?section= (admin)
// @access  Private (Instructor of the subject / Admin)
exports.getIdCards = async (req, res) => {
  try {
    const { subjectId, section } = req.query;
    let query;
    let title;
    if (subjectId) {
      const subject = await loadManagedSubject(req, subjectId);
      query = rosterQueryFor(subject);
      title = `${subject.code} · ${subject.section}`;
    } else if (section && req.user.role === 'ADMIN') {
      query = { role: 'STUDENT', section, isActive: { $ne: false } };
      title = section;
    } else {
      throw new HttpError(400, 'Choose a subject (or, for admins, a section).');
    }
    const students = await User.find(query).select('fullName userCustomId section').populate('program', 'code').sort({ fullName: 1 });
    res.status(200).json({
      success: true,
      title,
      data: students.map((s) => ({
        _id: s._id,
        fullName: s.fullName,
        userCustomId: s.userCustomId,
        section: s.section,
        program: s.program?.code || '',
        payload: qr.studentPayload(s._id)
      }))
    });
  } catch (error) {
    sendError(res, error);
  }
};
