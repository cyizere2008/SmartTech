const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  headOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }]
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);