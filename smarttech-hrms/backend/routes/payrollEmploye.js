const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ==================== GET ROUTES ====================

// Get payroll records (Employees see only their own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching payroll records for user:', req.user.id, 'Role:', req.user.role);
    
    let query = {};
    
    // If user is employee, only show their own records
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const employee = await Employee.findOne({ email: user.email });
      if (!employee) {
        console.log('No employee record found for user:', user.email);
        return res.json([]);
      }
      
      query.employee = employee._id;
      console.log('Filtering for employee:', employee.fullname);
    } else {
      // For HR/Admin, apply filters if provided
      const { employeeId, month, year } = req.query;
      if (employeeId && employeeId !== '') query.employee = employeeId;
      if (month && month !== '') query.month = parseInt(month);
      if (year && year !== '') query.year = parseInt(year);
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

// Get single payroll record
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'fullname email position department salary phone address')
      .populate('createdBy', 'fullname');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Check permission
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      const employee = await Employee.findOne({ email: user.email });
      if (payroll.employee._id.toString() !== employee?._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(payroll);
  } catch (err) {
    console.error('Error fetching payroll:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get payroll summary/overview (for statistics cards)
router.get('/summary/overview', authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    console.log(`Fetching summary for ${currentMonth}/${currentYear} for role: ${req.user.role}`);
    
    let employeeFilter = {};
    
    // For employees, only their own data
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      const employee = await Employee.findOne({ email: user.email });
      if (employee) {
        employeeFilter.employee = employee._id;
        console.log('Filtering summary for employee:', employee.fullname);
      }
    }
    
    // Get total active employees (for HR/Admin) or just 1 for employee
    let totalEmployees = 0;
    if (req.user.role === 'employee') {
      totalEmployees = 1;
    } else {
      totalEmployees = await Employee.countDocuments({ isActive: true });
    }
    
    // Get payroll records for selected month/year
    const payrollQuery = { 
      month: currentMonth, 
      year: currentYear,
      ...employeeFilter
    };
    
    const payrolls = await Payroll.find(payrollQuery)
      .populate('employee', 'fullname salary');
    
    // Calculate totals
    const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const averageSalary = payrolls.length > 0 ? totalPayroll / payrolls.length : 0;
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
      processedCount: payrolls.length,
      myPayroll: req.user.role === 'employee' && payrolls.length > 0 ? payrolls[0] : null
    };
    
    console.log('Summary data:', summaryData);
    res.json(summaryData);
  } catch (err) {
    console.error('Error fetching payroll summary:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get employee payroll history (for employees to see their own)
router.get('/employee/history', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching employee payroll history');
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await Employee.findOne({ email: user.email });
    if (!employee) {
      return res.json([]);
    }
    
    const payrolls = await Payroll.find({ employee: employee._id })
      .populate('employee', 'fullname email position')
      .sort({ year: -1, month: -1 });
    
    console.log(`Found ${payrolls.length} payroll records for employee`);
    res.json(payrolls);
  } catch (err) {
    console.error('Error fetching employee payroll history:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== POST ROUTES ====================

// Calculate and create payroll (HR/Admin only)
router.post('/calculate', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Calculating payroll...');
    const { 
      employeeId, 
      month, 
      year, 
      overtime, 
      allowances, 
      bonuses, 
      deductions 
    } = req.body;
    
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
    await payroll.populate('employee', 'fullname email position salary');
    
    console.log(`✅ Payroll calculated for ${employee.fullname}`);
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

// ==================== PUT ROUTES ====================

// Mark payroll as paid (HR/Admin only)
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

// ==================== TEST ROUTE ====================
router.get('/test', (req, res) => {
  res.json({ message: 'Payroll routes are working!', timestamp: new Date() });
});

module.exports = router;