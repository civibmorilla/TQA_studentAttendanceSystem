const User = require('../models/User');
const Program = require('../models/Program');
const Subject = require('../models/Subject');
const EnrollmentKey = require('../models/EnrollmentKey');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/audit');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { resolveRequestsFor } = require('./passwordResetController');

const generateToken = (id, role) => {
  // SECURITY: sessions last 1 day by default (was 30 days). Override with JWT_EXPIRES_IN.
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

// @desc    Register a new user (Student, Instructor, or Admin)
exports.registerUser = async (req, res) => {
  try {
    const { userCustomId, fullName, email, password, contactNo, address, enrollmentKey } = req.body;
    let role = req.body.role || 'STUDENT';

    // SECURITY FIX: the public sign-up form used to let anyone create an ADMIN.
    // Staff accounts (INSTRUCTOR / ADMIN) can now only be created by a logged-in admin,
    // except for the very first ADMIN (bootstrap of an empty database).
    if (role !== 'STUDENT') {
      const isAdminCaller = req.user && req.user.role === 'ADMIN';
      const isBootstrap = role === 'ADMIN' && (await User.countDocuments({ role: 'ADMIN' })) === 0;
      if (!isAdminCaller && !isBootstrap) {
        return res.status(403).json({ success: false, message: 'Only an administrator can create instructor or admin accounts.' });
      }
    }
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) role = 'STUDENT';
    if (!userCustomId || !fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'ID, full name, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // RA 10173: people signing themselves up must accept the privacy notice
    const isAdminCreating = req.user && req.user.role === 'ADMIN';
    if (!isAdminCreating && req.body.privacyConsent !== true) {
      return res.status(400).json({ success: false, message: 'Please read and accept the privacy notice to create an account.' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { userCustomId }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists in the system' });
    }

    let enrollmentData = { isEnrolled: false };

    // Process enrollment key if provided by student
    if (role === 'STUDENT' && enrollmentKey && enrollmentKey.trim()) {
      const cleanKey = enrollmentKey.trim().toUpperCase();
      const keyDoc = await EnrollmentKey.findOne({ key: cleanKey, status: 'ACTIVE' });
      if (!keyDoc) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive enrollment key provided.' });
      }
      if (keyDoc.useCount >= keyDoc.maxUses) {
        return res.status(400).json({ success: false, message: 'This enrollment key has already reached its maximum usage limit.' });
      }

      enrollmentData = {
        isEnrolled: true,
        program: keyDoc.program,
        yearLevel: keyDoc.yearLevel,
        section: keyDoc.section,
        enrolledSubjects: keyDoc.subjects,
        enrollmentKey: cleanKey
      };
    }

    const user = await User.create({
      userCustomId,
      fullName,
      email,
      password,
      role,
      contactNo,
      address,
      privacyConsentAt: isAdminCreating ? null : new Date(),
      ...enrollmentData
    });
    if (isAdminCreating) {
      logAudit(req, 'user.create', { entity: 'User', entityId: user._id, summary: `Created ${role} account ${userCustomId} (${fullName})` });
    }

    if (enrollmentData.isEnrolled && enrollmentKey) {
      const cleanKey = enrollmentKey.trim().toUpperCase();
      await EnrollmentKey.findOneAndUpdate(
        { key: cleanKey },
        { 
          $inc: { useCount: 1 },
          $push: { usedBy: { student: user._id, usedAt: new Date() } }
        }
      );
    }

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.fullName,
        role: user.role,
        isEnrolled: user.isEnrolled,
        token: generateToken(user._id, user.role),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
exports.loginUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await User.findOne({ userCustomId: username, role });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact an administrator.' });
      }

      res.json({
        success: true,
        _id: user._id,
        name: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials or incorrect role selected' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('program', 'code name')
      .populate({
        path: 'enrolledSubjects',
        populate: { path: 'instructor', select: 'fullName email' }
      })
      .select('-password');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN USER MANAGEMENT ================= //

// @desc    Get all users (Populates the Admin Accounts Table)
// @access  Private (Admin Only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('program', 'code name')
      .select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user details (Edit Account)
// @access  Private (Admin Only)
exports.updateUser = async (req, res) => {
  try {
    // Prevent password updates through this route
    if (req.body.password) {
      delete req.body.password;
    }
    
    // Fields that must never be set through this route
    ['password', 'privacyConsentAt', 'mustChangePassword'].forEach((f) => delete req.body[f]);
    if (String(req.params.id) === String(req.user._id) && (req.body.role || req.body.isActive === false)) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role or deactivate yourself.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, 
      runValidators: true
    }).select('-password');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    logAudit(req, 'user.update', {
      entity: 'User', entityId: user._id,
      summary: `Updated ${user.userCustomId}: ${Object.keys(req.body).join(', ')}`,
      details: req.body
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate/Delete user account
// @access  Private (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    logAudit(req, 'user.delete', { entity: 'User', entityId: user._id, summary: `Deleted ${user.role} ${user.userCustomId} (${user.fullName})` });
    res.status(200).json({ success: true, message: 'User account deactivated and removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregated dashboard stats (programs, instructors, classes)
// @access  Private (Admin Only)
exports.getDashboardStats = async (req, res) => {
  try {
    const programsCount = await Program.countDocuments();
    const instructorsCount = await User.countDocuments({ role: 'INSTRUCTOR' });
    const classesCount = await Subject.countDocuments();
    const pendingResetRequests = await PasswordResetRequest.countDocuments({ status: 'PENDING' });

    // Get recent instructors (last 5)
    const recentInstructors = await User.find({ role: 'INSTRUCTOR' })
      .select('fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent subjects/classes
    const recentClasses = await Subject.find()
      .populate('program', 'code name')
      .populate('instructor', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        programs: programsCount,
        instructors: instructorsCount,
        classes: classesCount,
        pendingResetRequests,
      },
      recentInstructors,
      recentClasses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= PASSWORDS ================= //

// 10-character temporary password, e.g. 'k3f9a01bc2'
const tempPassword = () => crypto.randomBytes(5).toString('hex');

// @desc    Logged-in user changes their own password
// @access  Private (any role)
exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    const user = await User.findById(req.user._id);
    if (!(await bcrypt.compare(currentPassword || '', user.password))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    logAudit(req, 'user.change_password', { entity: 'User', entityId: user._id, summary: `${user.userCustomId} changed their password` });
    res.status(200).json({ success: true, message: 'Password updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin resets someone's password; returns a temporary password to hand over
// @access  Private (Admin)
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const newPassword = req.body.newPassword && String(req.body.newPassword).length >= 8
      ? String(req.body.newPassword)
      : tempPassword();
    user.password = newPassword;
    user.mustChangePassword = true;
    await user.save();
    logAudit(req, 'user.reset_password', { entity: 'User', entityId: user._id, summary: `Reset password for ${user.userCustomId}` });
    // Close any "forgot password" request this person made
    await resolveRequestsFor(user._id, req.user._id);
    res.status(200).json({
      success: true,
      message: `Password reset for ${user.fullName}. They will be asked to change it after logging in.`,
      temporaryPassword: newPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= BULK IMPORT ================= //

// @desc    Create many student accounts at once (from a CSV parsed in the browser)
// @access  Private (Admin)
// body: { students: [{ userCustomId, fullName, email, password?, contactNo? }],
//         enrollment?: { program, yearLevel, section, subjects: [ids] } }
exports.bulkImportStudents = async (req, res) => {
  try {
    const { students, enrollment } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'No students to import.' });
    }
    if (students.length > 500) {
      return res.status(400).json({ success: false, message: 'Import at most 500 students at a time.' });
    }

    const enroll = enrollment && enrollment.section
      ? {
          isEnrolled: true,
          program: enrollment.program || null,
          yearLevel: enrollment.yearLevel || null,
          section: enrollment.section,
          enrolledSubjects: Array.isArray(enrollment.subjects) ? enrollment.subjects : []
        }
      : {};

    const results = [];
    for (const [i, row] of students.entries()) {
      const userCustomId = String(row.userCustomId || '').trim();
      const fullName = String(row.fullName || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      if (!userCustomId || !fullName || !email) {
        results.push({ row: i + 2, userCustomId, status: 'SKIPPED', reason: 'Missing ID, name or email' });
        continue;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        results.push({ row: i + 2, userCustomId, status: 'SKIPPED', reason: 'Invalid email' });
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const exists = await User.findOne({ $or: [{ email }, { userCustomId }] }).select('_id');
      if (exists) {
        results.push({ row: i + 2, userCustomId, status: 'SKIPPED', reason: 'ID or email already exists' });
        continue;
      }
      const password = row.password && String(row.password).length >= 8 ? String(row.password) : tempPassword();
      // eslint-disable-next-line no-await-in-loop
      await User.create({
        userCustomId, fullName, email, password, role: 'STUDENT',
        contactNo: row.contactNo || undefined,
        mustChangePassword: true,
        ...enroll
      });
      results.push({ row: i + 2, userCustomId, fullName, status: 'CREATED', temporaryPassword: password });
    }

    const created = results.filter((r) => r.status === 'CREATED').length;
    logAudit(req, 'user.bulk_import', {
      entity: 'User',
      summary: `Imported ${created} of ${students.length} students${enroll.section ? ` into ${enroll.section}` : ''}`
    });
    res.status(200).json({ success: true, created, skipped: students.length - created, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= AUDIT LOG ================= //

// @desc    Recent audit log entries (newest first)
// @access  Private (Admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 200, before } = req.query;
    const query = {};
    if (action) query.action = new RegExp(`^${String(action).replace(/[^a-z_.]/gi, '')}`);
    if (before) query.createdAt = { $lt: new Date(before) };
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 200, 500));
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
