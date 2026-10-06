const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user (Student, Instructor, or Admin)
exports.registerUser = async (req, res) => {
  try {
    const { userCustomId, fullName, email, password, role, contactNo, address } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { userCustomId }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists in the system' });
    }

    const user = await User.create({
      userCustomId, fullName, email, password, role, contactNo, address
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.fullName,
        role: user.role,
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
      res.json({
        success: true,
        _id: user._id,
        name: user.fullName,
        role: user.role,
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
    const user = await User.findById(req.user.id).select('-password');
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
    const users = await User.find().select('-password');
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
    
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, 
      runValidators: true
    }).select('-password');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate/Delete user account
// @access  Private (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User account deactivated and removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};