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
  address: { type: String, default: 'Bataan, Philippines' },
  // Academic Enrollment Configuration (assigned via Admin / Enrollment Key)
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  yearLevel: { type: String, default: null },
  section: { type: String, default: null },
  enrolledSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  isEnrolled: { type: Boolean, default: false },
  enrollmentKey: { type: String, default: null },
  // RA 10173: when the user agreed to the privacy notice (null for admin-created accounts)
  privacyConsentAt: { type: Date, default: null },
  // Set when an admin resets the password, so the user is asked to change it
  mustChangePassword: { type: Boolean, default: false }
}, { timestamps: true });

// Hash password before saving to the database
UserSchema.pre('save', async function() {
  // BUGFIX: without `return`, every save() re-hashed the already-hashed password,
  // locking the user out after any profile/enrollment update.
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);