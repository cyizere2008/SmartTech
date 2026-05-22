const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewDate: { type: Date, default: Date.now },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String, required: true },
  goals: { type: String },
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'submitted' }
}, { timestamps: true });

module.exports = mongoose.model('Performance', PerformanceSchema);