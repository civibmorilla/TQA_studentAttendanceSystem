const User = require('../models/User');
const { logAudit } = require('../utils/audit');
const { signupMode, STUDENT_ID_EXAMPLE } = require('../utils/studentId');

// @desc    How sign-up works right now (public), so the Register page can adapt
// @route   GET /api/v1/auth/signup-mode
exports.getSignupMode = async (req, res) => {
  try {
    const needsFirstAdmin = (await User.countDocuments({ role: 'ADMIN' })) === 0;
    res.status(200).json({ success: true, mode: signupMode(), needsFirstAdmin, studentIdExample: STUDENT_ID_EXAMPLE });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student accounts waiting for approval (admin)
// @route   GET /api/v1/auth/account-requests
exports.getAccountRequests = async (req, res) => {
  try {
    const requests = await User.find({ approvalStatus: 'PENDING' })
      .select('fullName userCustomId email role createdAt section isEnrolled')
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const decide = (status) => async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });
    if (user.approvalStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request was already handled.' });
    }
    user.approvalStatus = status;
    await user.save();
    logAudit(req, status === 'APPROVED' ? 'user.approve' : 'user.reject', {
      entity: 'User',
      entityId: user._id,
      summary: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} account request ${user.userCustomId} (${user.fullName})`
    });
    res.status(200).json({
      success: true,
      message: status === 'APPROVED'
        ? `${user.fullName} can now log in. Enroll them in a class next.`
        : `Request from ${user.fullName} was rejected. The account stays blocked.`,
      data: { _id: user._id, fullName: user.fullName, userCustomId: user.userCustomId, isEnrolled: user.isEnrolled, section: user.section, enrolledSubjects: user.enrolledSubjects }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/v1/auth/account-requests/:id/approve
exports.approveAccount = decide('APPROVED');
// @route   PATCH /api/v1/auth/account-requests/:id/reject
exports.rejectAccount = decide('REJECTED');
