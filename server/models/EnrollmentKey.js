const mongoose = require('mongoose');

const EnrollmentKeySchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  },
  program: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Program', 
    required: true 
  },
  yearLevel: { 
    type: String, 
    required: true 
  },
  section: { 
    type: String, 
    required: true 
  },
  subjects: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject' 
  }],
  assignedStudentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  maxUses: { 
    type: Number, 
    default: 1 
  },
  useCount: { 
    type: Number, 
    default: 0 
  },
  usedBy: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['ACTIVE', 'USED', 'EXPIRED'], 
    default: 'ACTIVE' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

module.exports = mongoose.model('EnrollmentKey', EnrollmentKeySchema);
