const Program = require('../models/Program');
const Subject = require('../models/Subject');
const User = require('../models/User');
const EnrollmentKey = require('../models/EnrollmentKey');

// ================= PROGRAMS ================= //

// @desc    Create a new academic program
// @access  Private (Admin only)
exports.createProgram = async (req, res) => {
  try {
    const program = await Program.create(req.body);
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all academic programs
// @access  Private (Any authenticated user)
exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    res.status(200).json({ success: true, count: programs.length, data: programs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an academic program
// @access  Private (Admin only)
exports.updateProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.status(200).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an academic program
// @access  Private (Admin only)
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.status(200).json({ success: true, message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= SUBJECTS ================= //

// @desc    Create a new subject/class schedule
// @access  Private (Admin only)
exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get subjects (Supports filtering by section, program, or instructor via req.query)
// @access  Private (Any authenticated user)
exports.getSubjects = async (req, res) => {
  try {
    let query = {};
    if (req.query.section) query.section = req.query.section;
    if (req.query.instructor) query.instructor = req.query.instructor;
    if (req.query.program) query.program = req.query.program;

    const subjects = await Subject.find(query)
      .populate('program', 'code name')
      .populate('instructor', 'fullName userCustomId');

    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ENROLLMENT KEYS & ASSIGNMENTS ================= //

// @desc    Admin generates an enrollment key for a program & subjects
// @access  Private (Admin only)
exports.createEnrollmentKey = async (req, res) => {
  try {
    const { programId, yearLevel, section, subjects, assignedStudentId, maxUses, customKey } = req.body;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Academic program not found' });
    }

    // Auto-generate key if customKey is not provided
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanCode = program.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const generatedKey = (customKey || `ENR-${cleanCode}-${randomSuffix}`).trim().toUpperCase();

    // Check duplicate key
    const existing = await EnrollmentKey.findOne({ key: generatedKey });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Enrollment key already exists. Please choose a different key code.' });
    }

    const enrollmentKey = await EnrollmentKey.create({
      key: generatedKey,
      program: programId,
      yearLevel: yearLevel || '1st Year',
      section: section || `${program.code}-101`,
      subjects: subjects || [],
      assignedStudentId: assignedStudentId || null,
      maxUses: maxUses ? Number(maxUses) : 1,
      createdBy: req.user.id
    });

    const populated = await EnrollmentKey.findById(enrollmentKey._id)
      .populate('program', 'code name')
      .populate('subjects', 'code title room schedule')
      .populate('assignedStudentId', 'fullName userCustomId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin gets all enrollment keys
// @access  Private (Admin only)
exports.getEnrollmentKeys = async (req, res) => {
  try {
    const keys = await EnrollmentKey.find()
      .populate('program', 'code name')
      .populate('subjects', 'code title room schedule')
      .populate('assignedStudentId', 'fullName userCustomId')
      .populate('usedBy.student', 'fullName userCustomId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: keys.length, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin deletes an enrollment key
// @access  Private (Admin only)
exports.deleteEnrollmentKey = async (req, res) => {
  try {
    const key = await EnrollmentKey.findByIdAndDelete(req.params.id);
    if (!key) {
      return res.status(404).json({ success: false, message: 'Enrollment key not found' });
    }
    res.status(200).json({ success: true, message: 'Enrollment key deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student redeems an enrollment key to get assigned program & subjects
// @access  Private (Student only)
exports.enrollWithKey = async (req, res) => {
  try {
    const { enrollmentKey } = req.body;
    if (!enrollmentKey) {
      return res.status(400).json({ success: false, message: 'Enrollment key is required' });
    }

    const cleanKey = enrollmentKey.trim().toUpperCase();
    const keyDoc = await EnrollmentKey.findOne({ key: cleanKey })
      .populate('program', 'code name')
      .populate('subjects');

    if (!keyDoc) {
      return res.status(404).json({ success: false, message: 'Invalid enrollment key. Please check with your school administrator.' });
    }

    if (keyDoc.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: `This enrollment key is ${keyDoc.status.toLowerCase()} and cannot be used.` });
    }

    if (keyDoc.assignedStudentId && keyDoc.assignedStudentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'This enrollment key is assigned to another student ID.' });
    }

    if (keyDoc.useCount >= keyDoc.maxUses) {
      keyDoc.status = 'USED';
      await keyDoc.save();
      return res.status(400).json({ success: false, message: 'This enrollment key has already reached its maximum usage limit.' });
    }

    // Update Student User record
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    student.program = keyDoc.program._id;
    student.yearLevel = keyDoc.yearLevel;
    student.section = keyDoc.section;
    student.enrolledSubjects = keyDoc.subjects.map(s => s._id);
    student.isEnrolled = true;
    student.enrollmentKey = cleanKey;
    await student.save();

    // Update key usage
    keyDoc.useCount += 1;
    keyDoc.usedBy.push({ student: student._id, usedAt: new Date() });
    if (keyDoc.useCount >= keyDoc.maxUses) {
      keyDoc.status = 'USED';
    }
    await keyDoc.save();

    res.status(200).json({
      success: true,
      message: `Enrolled successfully into ${keyDoc.program.name} (${keyDoc.section})!`,
      data: {
        program: keyDoc.program,
        section: keyDoc.section,
        yearLevel: keyDoc.yearLevel,
        subjectsCount: keyDoc.subjects.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get the logged-in student's enrolled subjects
// @access  Private (Student only)
exports.getMyEnrolledSubjects = async (req, res) => {
  try {
    const student = await User.findById(req.user.id)
      .populate('program', 'code name')
      .populate({
        path: 'enrolledSubjects',
        populate: [
          { path: 'instructor', select: 'fullName email userCustomId' },
          { path: 'program', select: 'code name' }
        ]
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.isEnrolled) {
      return res.status(200).json({
        success: true,
        isEnrolled: false,
        message: 'No courses enrolled yet. Please redeem an enrollment key provided by your administrator.',
        data: []
      });
    }

    res.status(200).json({
      success: true,
      isEnrolled: true,
      program: student.program,
      section: student.section,
      yearLevel: student.yearLevel,
      enrollmentKey: student.enrollmentKey,
      data: student.enrolledSubjects || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin directly assigns a student to program, section, and subjects
// @access  Private (Admin only)
exports.assignStudentDirectly = async (req, res) => {
  try {
    const { studentId, programId, yearLevel, section, subjects } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Academic program not found' });
    }

    student.program = programId;
    student.yearLevel = yearLevel || '1st Year';
    student.section = section || `${program.code}-101`;
    student.enrolledSubjects = subjects || [];
    student.isEnrolled = true;
    student.enrollmentKey = 'ADMIN-ASSIGNED';
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student "${student.fullName}" enrolled into ${program.code} (${student.section}) directly.`,
      data: student
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};