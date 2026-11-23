const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { logAudit } = require('../utils/audit');

// Same answer whether or not the account exists, so the form can't be used
// to find out which IDs or emails are registered.
const GENERIC_REPLY =
  'If the ID and email match an account, your request has been sent to the school administrator. ' +
  'They will verify your identity and give you a temporary password.';

// @desc    "Forgot password" request from the login page (public)
// @route   POST /api/v1/auth/forgot-password
exports.requestPasswordReset = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const note = String(req.body.note || '').trim().slice(0, 300);

    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'Enter your ID number and the email on your account.' });
    }

    const user = await User.findOne({ userCustomId: username });
    const matches = user && user.isActive !== false && String(user.email || '').toLowerCase() === email;

    if (matches) {
      const ip = req.ip || '';
      // One open request per person: a repeat just refreshes it
      const existing = await PasswordResetRequest.findOne({ user: user._id, status: 'PENDING' });
      if (existing) {
        existing.requestCount += 1;
        existing.lastRequestedAt = new Date();
        if (note) existing.note = note;
        existing.ip = ip;
        await existing.save();
      } else {
        await PasswordResetRequest.create({ user: user._id, note, ip });
      }
      logAudit(req, 'user.reset_request', {
        entity: 'User',
        entityId: user._id,
        summary: `${user.userCustomId} asked for a password reset`
      });
    }

    res.status(200).json({ success: true, message: GENERIC_REPLY });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
  }
};

// @desc    List password reset requests (admin)
// @route   GET /api/v1/auth/reset-requests?status=PENDING|RESOLVED|DISMISSED|ALL
exports.getResetRequests = async (req, res) => {
  try {
    const status = String(req.query.status || 'PENDING').toUpperCase();
    const query = status === 'ALL' ? {} : { status };
    const requests = await PasswordResetRequest.find(query)
      .populate('user', 'fullName userCustomId email role isActive')
      .populate('handledBy', 'fullName')
      .sort({ lastRequestedAt: -1 })
      .limit(200);
    res.status(200).json({ success: true, data: requests.filter((r) => r.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dismiss a request without resetting (e.g. could not verify the person)
// @route   PATCH /api/v1/auth/reset-requests/:id/dismiss
exports.dismissResetRequest = async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id).populate('user', 'userCustomId');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request was already handled.' });
    }
    request.status = 'DISMISSED';
    request.handledBy = req.user._id;
    request.handledAt = new Date();
    await request.save();
    logAudit(req, 'user.reset_request_dismissed', {
      entity: 'User',
      entityId: request.user?._id,
      summary: `Dismissed password reset request from ${request.user?.userCustomId || 'unknown user'}`
    });
    res.status(200).json({ success: true, message: 'Request dismissed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Called after an admin resets someone's password: closes their open requests.
exports.resolveRequestsFor = (userId, adminId) =>
  PasswordResetRequest.updateMany(
    { user: userId, status: 'PENDING' },
    { $set: { status: 'RESOLVED', handledBy: adminId, handledAt: new Date() } }
  ).catch((err) => console.error('Could not close reset requests:', err.message));
