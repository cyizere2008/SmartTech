const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  checkIn: { 
    type: Date 
  },
  checkOut: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'half-day'], 
    default: 'present' 
  },
  lateMinutes: { 
    type: Number, 
    default: 0 
  },
  workHours: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Calculate work hours before saving
AttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const hours = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.workHours = parseFloat(hours.toFixed(2));
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);