const User = require('../models/User');
const { logAudit } = require('../utils/audit');

// A user's own profile: what they may see and change about themselves.
// Name, ID, role and enrollment stay admin-managed.
const OWN_FIELDS = 'fullName userCustomId email role contactNo address photo section yearLevel isEnrolled';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO_CHARS = 350000; // about 250 KB; the browser sends ~20-40 KB after resizing

// @desc    Own profile, unmasked (it's the user's own data)
// @route   GET /api/v1/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(OWN_FIELDS).populate('program', 'code name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update own email, contact number, address and photo
// @route   PUT /api/v1/auth/me   { email?, contactNo?, address?, photo? ('' removes it) }
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const changed = [];
    const { email, contactNo, address, photo } = req.body;

    if (email !== undefined) {
      const value = String(email).trim().toLowerCase();
      if (!EMAIL_RE.test(value)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
      if (value !== user.email) {
        const taken = await User.exists({ email: value, _id: { $ne: user._id } });
        if (taken) return res.status(400).json({ success: false, message: 'That email is already used by another account.' });
        user.email = value;
        changed.push('email');
      }
    }

    if (contactNo !== undefined) {
      const value = String(contactNo).trim();
      if (value && !PHONE_RE.test(value)) {
        return res.status(400).json({ success: false, message: 'Contact number can only contain digits, spaces, +, - and brackets (7 to 20 characters).' });
      }
      if (value !== user.contactNo) { user.contactNo = value; changed.push('contactNo'); }
    }

    if (address !== undefined) {
      const value = String(address).trim();
      if (value.length > 200) return res.status(400).json({ success: false, message: 'Address must be 200 characters or fewer.' });
      if (value !== user.address) { user.address = value; changed.push('address'); }
    }

    if (photo !== undefined) {
      const value = String(photo);
      if (value && (!PHOTO_RE.test(value) || value.length > MAX_PHOTO_CHARS)) {
        return res.status(400).json({ success: false, message: 'The picture must be a JPG, PNG or WebP image under 250 KB.' });
      }
      if (value !== user.photo) { user.photo = value; changed.push(value ? 'photo' : 'photo removed'); }
    }

    if (changed.length) {
      await user.save();
      logAudit(req, 'user.update_profile', {
        entity: 'User',
        entityId: user._id,
        summary: `${user.userCustomId} updated their profile: ${changed.join(', ')}`
      });
    }

    const fresh = await User.findById(user._id).select(OWN_FIELDS).populate('program', 'code name');
    res.status(200).json({ success: true, message: changed.length ? 'Profile saved.' : 'Nothing to change.', data: fresh });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
