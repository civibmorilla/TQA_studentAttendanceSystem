const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  userCustomId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'], 
    default: 'STUDENT',
    required: true 
  },
  isActive: { type: Boolean, default: true },
  contactNo: { type: String, default: '0917-000-0000' },
  address: { type: String, default: 'Bataan, Philippines' }
}, { timestamps: true });

// Hash password before saving to the database
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);