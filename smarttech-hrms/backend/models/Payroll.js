const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  month: { 
    type: Number, 
    required: true,
    min: 1,
    max: 12
  },
  year: { 
    type: Number, 
    required: true,
    min: 2020,
    max: 2030
  },
  basicSalary: { 
    type: Number, 
    required: true,
    default: 0
  },
  overtime: { 
    type: Number, 
    default: 0 
  },
  allowances: { 
    type: Number, 
    default: 0 
  },
  taxDeductions: { 
    type: Number, 
    default: 0 
  },
  bonuses: { 
    type: Number, 
    default: 0 
  },
  deductions: { 
    type: Number, 
    default: 0 
  },
  netSalary: { 
    type: Number, 
    required: true,
    default: 0
  },
  isPaid: { 
    type: Boolean, 
    default: false 
  },
  paymentDate: { 
    type: Date 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);