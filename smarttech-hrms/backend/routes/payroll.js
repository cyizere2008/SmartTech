const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ==================== GET ROUTES ====================

// Get payroll records with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching payroll records...');
    const { employeeId, month, year } = req.query;
    let query = {};
    
    // Build query based on filters
    if (employeeId && employeeId !== '') {
      query.employee = employeeId;
    }
    if (month && month !== '') {
      query.month = parseInt(month);
    }
    if (year && year !== '') {
      query.year = parseInt(year);
    }
    
    console.log('Query:', query);
    
    // If user is employee, show only their records
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      const employee = await Employee.findOne({ email: user.email });
      if (employee) {
        query.employee = employee._id;
      } else {
        return res.json([]);
      }
    }
    
    const payrolls = await Payroll.find(query)
      .populate('employee', 'fullname email position department salary')
      .populate('createdBy', 'fullname')
      .sort({ year: -1, month: -1, createdAt: -1 });
    
    console.log(`Found ${payrolls.length} payroll records`);
    res.json(payrolls);
  } catch (err) {
    console.error('Error fetching payrolls:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get payroll summary/overview (for statistics cards)
router.get('/summary/overview', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    console.log(`Fetching summary for ${currentMonth}/${currentYear}`);
    
    // Get total active employees
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    
    // Get payroll records for selected month/year
    const payrolls = await Payroll.find({ 
      month: currentMonth, 
      year: currentYear 
    }).populate('employee', 'fullname salary');
    
    // Calculate total payroll
    const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    
    // Calculate average salary
    const averageSalary = payrolls.length > 0 ? totalPayroll / payrolls.length : 0;
    
    // Count paid and pending
    const paidCount = payrolls.filter(p => p.isPaid).length;
    const pendingCount = payrolls.filter(p => !p.isPaid).length;
    
    const summaryData = {
      totalEmployees,
      totalPayroll,
      averageSalary,
      paidCount,
      pendingCount,
      month: currentMonth,
      year: currentYear,
      processedCount: payrolls.length
    };
    
    console.log('Summary data:', summaryData);
    res.json(summaryData);
  } catch (err) {
    console.error('Error fetching payroll summary:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Calculate and create payroll (HR/Admin only)
router.post('/calculate', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { 
      employeeId, 
      month, 
      year, 
      overtime, 
      allowances, 
      bonuses, 
      deductions 
    } = req.body;
    
    console.log('Calculating payroll for:', { employeeId, month, year });
    
    // Validate required fields
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    
    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if payroll already exists for this month/year
    const existingPayroll = await Payroll.findOne({ 
      employee: employeeId, 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (existingPayroll) {
      return res.status(400).json({ 
        message: `Payroll already calculated for ${month}/${year} for this employee` 
      });
    }
    
    const basicSalary = employee.salary || 0;
    const taxDeductions = basicSalary * 0.1; // 10% tax rate
    const netSalary = basicSalary + (parseFloat(overtime) || 0) + (parseFloat(allowances) || 0) + (parseFloat(bonuses) || 0) 
                    - taxDeductions - (parseFloat(deductions) || 0);
    
    const payroll = new Payroll({
      employee: employeeId,
      month: parseInt(month),
      year: parseInt(year),
      basicSalary,
      overtime: parseFloat(overtime) || 0,
      allowances: parseFloat(allowances) || 0,
      taxDeductions,
      bonuses: parseFloat(bonuses) || 0,
      deductions: parseFloat(deductions) || 0,
      netSalary,
      createdBy: req.user.id
    });
    
    await payroll.save();
    
    // Populate employee data for response
    await payroll.populate('employee', 'fullname email position salary');
    
    console.log('Payroll calculated successfully:', payroll._id);
    res.status(201).json({
      success: true,
      message: 'Payroll calculated successfully',
      payroll
    });
  } catch (err) {
    console.error('Error calculating payroll:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Payroll record already exists for this period' });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Mark payroll as paid
router.put('/:id/paid', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    if (payroll.isPaid) {
      return res.status(400).json({ message: 'Payroll already marked as paid' });
    }
    
    payroll.isPaid = true;
    payroll.paymentDate = new Date();
    
    await payroll.save();
    
    res.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      payroll
    });
  } catch (err) {
    console.error('Error marking payroll as paid:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;