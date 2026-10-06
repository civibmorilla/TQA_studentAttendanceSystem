const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');

// @desc    Batch save or update daily attendance sheet
// @access  Private (Instructor Only)
exports.saveDailyAttendance = async (req, res) => {
  try {
    const { subjectId, date, roster } = req.body;
    
    // Process roster array: [{ studentId, status }, ...]
    const operations = roster.map(student => ({
      updateOne: {
        filter: { studentId: student.studentId, subjectId, date },
        update: { $set: { status: student.status, recordedBy: req.user.id } },
        upsert: true // Creates the document if it doesn't exist, updates if it does
      }
    }));

    await Attendance.bulkWrite(operations);
    res.status(200).json({ success: true, message: 'Attendance sheet saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance sheet for a specific class and date
// @access  Private (Instructor Only)
exports.getClassAttendance = async (req, res) => {
  try {
    const { subjectId, date } = req.query;
    
    const records = await Attendance.find({ subjectId, date })
      .populate('studentId', 'fullName userCustomId');
      
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get personal attendance stats and timeline
// @access  Private (Student Only)
exports.getStudentStats = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || !student.isEnrolled) {
      return res.status(200).json({
        success: true,
        isEnrolled: false,
        stats: { total: 0, present: 0, late: 0, absent: 0, rate: 100.0, isBelowTarget: false },
        logs: []
      });
    }

    const studentId = req.user.id;
    const { subjectId } = req.query; // Optional: filter by specific subject

    let query = { studentId };
    if (subjectId) {
      query.subjectId = subjectId;
    } else if (student.enrolledSubjects && student.enrolledSubjects.length > 0) {
      query.subjectId = { $in: student.enrolledSubjects };
    }

    const logs = await Attendance.find(query).populate('subjectId', 'title code');

    const total = logs.length;
    const present = logs.filter(l => l.status === 'PRESENT').length;
    const late = logs.filter(l => l.status === 'LATE').length;
    const absent = logs.filter(l => l.status === 'ABSENT').length;

    // Lates count as 0.5 (half-presence) for strict calculation
    const rate = total > 0 ? (((present + (late * 0.5)) / total) * 100).toFixed(1) : 100.0;
    const isBelowTarget = parseFloat(rate) < 80.0;

    res.status(200).json({
      success: true,
      isEnrolled: true,
      stats: { total, present, late, absent, rate: Number(rate), isBelowTarget },
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get students enrolled in a specific section (for roster building)
// @access  Private (Instructor/Admin Only)
exports.getStudentsBySection = async (req, res) => {
  try {
    const { section } = req.query;
    if (!section) {
      return res.status(400).json({ success: false, message: 'Section query parameter is required' });
    }
    
    // Find students enrolled in this section
    let students = await User.find({ role: 'STUDENT', section: section, isEnrolled: true })
      .select('fullName userCustomId section');

    // Fallback if no students enrolled in that specific section yet
    if (students.length === 0) {
      students = await User.find({ role: 'STUDENT' }).select('fullName userCustomId section');
    }

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};