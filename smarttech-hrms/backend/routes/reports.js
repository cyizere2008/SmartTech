const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Generate employee report
router.get('/employees', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { department, status } = req.query;
    let query = {};
    
    if (department) query.department = department;
    if (status) query.isActive = status === 'active';
    
    const employees = await Employee.find(query)
      .populate('department', 'name')
      .select('-__v');
    
    const summary = {
      total: employees.length,
      byDepartment: {},
      totalSalary: employees.reduce((sum, e) => sum + (e.salary || 0), 0)
    };
    
    employees.forEach(emp => {
      const deptName = emp.department?.name || 'Unassigned';
      summary.byDepartment[deptName] = (summary.byDepartment[deptName] || 0) + 1;
    });
    
    res.json({ employees, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Generate attendance report
router.get('/attendance', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { month, year, department } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    let query = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (department) {
      const employees = await Employee.find({ department });
      query.employee = { $in: employees.map(e => e._id) };
    }
    
    const attendances = await Attendance.find(query)
      .populate('employee', 'fullname email department');
    
    const summary = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'present').length,
      late: attendances.filter(a => a.status === 'late').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      averageLateMinutes: attendances.reduce((sum, a) => sum + (a.lateMinutes || 0), 0) / attendances.length || 0
    };
    
    res.json({ attendances, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Generate payroll report
router.get('/payroll', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { month, year, department } = req.query;
    
    let query = { month: parseInt(month), year: parseInt(year) };
    
    if (department) {
      const employees = await Employee.find({ department });
      query.employee = { $in: employees.map(e => e._id) };
    }
    
    const payrolls = await Payroll.find(query)
      .populate('employee', 'fullname email department position');
    
    const summary = {
      totalEmployees: payrolls.length,
      totalGrossSalary: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      totalTax: payrolls.reduce((sum, p) => sum + p.taxDeductions, 0),
      totalBonuses: payrolls.reduce((sum, p) => sum + p.bonuses, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions, 0),
      paidCount: payrolls.filter(p => p.isPaid).length,
      pendingCount: payrolls.filter(p => !p.isPaid).length
    };
    
    res.json({ payrolls, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Generate leave report
router.get('/leaves', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { status, startDate, endDate, department } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    
    if (department) {
      const employees = await Employee.find({ department });
      query.employee = { $in: employees.map(e => e._id) };
    }
    
    const leaves = await Leave.find(query)
      .populate('employee', 'fullname email department');
    
    const summary = {
      total: leaves.length,
      byStatus: {
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length
      },
      byType: {}
    };
    
    leaves.forEach(leave => {
      summary.byType[leave.leaveType] = (summary.byType[leave.leaveType] || 0) + 1;
    });
    
    res.json({ leaves, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Generate department report
router.get('/departments', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('employees', 'fullname email position salary');
    
    const report = departments.map(dept => ({
      name: dept.name,
      description: dept.description,
      employeeCount: dept.employees.length,
      totalSalary: dept.employees.reduce((sum, e) => sum + (e.salary || 0), 0),
      averageSalary: dept.employees.reduce((sum, e) => sum + (e.salary || 0), 0) / (dept.employees.length || 1),
      headOfDepartment: dept.headOfDepartment
    }));
    
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Generate performance report
router.get('/performance', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { year, department } = req.query;
    
    let query = {};
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query.reviewDate = { $gte: startDate, $lte: endDate };
    }
    
    if (department) {
      const employees = await Employee.find({ department });
      query.employee = { $in: employees.map(e => e._id) };
    }
    
    const performances = await Performance.find(query)
      .populate('employee', 'fullname email department')
      .populate('reviewer', 'fullname');
    
    const summary = {
      totalReviews: performances.length,
      averageRating: performances.reduce((sum, p) => sum + p.rating, 0) / (performances.length || 1),
      ratingDistribution: {}
    };
    
    performances.forEach(p => {
      summary.ratingDistribution[p.rating] = (summary.ratingDistribution[p.rating] || 0) + 1;
    });
    
    res.json({ performances, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;