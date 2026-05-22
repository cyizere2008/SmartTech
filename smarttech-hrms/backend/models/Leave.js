const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  leaveType: { 
    type: String, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  reason: { 
    type: String,
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { 
    type: Date 
  },
  comments: { 
    type: String 
  },
  totalDays: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);