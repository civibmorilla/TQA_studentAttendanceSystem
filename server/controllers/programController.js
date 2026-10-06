const Program = require('../models/Program');
const Subject = require('../models/Subject');

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

// @desc    Get subjects (Supports filtering by section or instructor via req.query)
// @access  Private (Any authenticated user)
exports.getSubjects = async (req, res) => {
  try {
    // Allows dynamic filtering: /api/v1/academic/subjects?section=BSCpE-101
    let query = {};
    if (req.query.section) query.section = req.query.section;
    if (req.query.instructor) query.instructor = req.query.instructor;

    const subjects = await Subject.find(query)
      .populate('program', 'code name')
      .populate('instructor', 'fullName userCustomId');

    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};