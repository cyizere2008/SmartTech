const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  dateOfBirth: Date,
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  position: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  salary: { type: Number, default: 0 },
  joiningDate: { type: Date, default: Date.now },
  profilePhoto: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);