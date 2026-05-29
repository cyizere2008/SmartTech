const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ==================== ATTENDANCE HR ROUTE ====================

// Get all attendance for HR (with department populated)
router.get('/hr/all', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 HR fetching all attendance records');
    
    const { employeeId, department, date, startDate, endDate } = req.query;
    let query = {};
    
    if (employeeId && employeeId !== '') query.employee = employeeId;
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDate };
    }
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    
    let attendances = await Attendance.find(query)
      .populate({
        path: 'employee',
        populate: {
          path: 'department',
          model: 'Department',
          select: 'name description'
        }
      })
      .sort({ date: -1 });
    
    // Filter by department if specified
    if (department && department !== '') {
      attendances = attendances.filter(a => 
        a.employee?.department?._id?.toString() === department ||
        a.employee?.department?.toString() === department
      );
    }
    
    // Format the response with proper department names
    const formattedAttendances = attendances.map(att => {
      const attObj = att.toObject();
      return {
        ...attObj,
        employee: {
          ...attObj.employee,
          departmentName: attObj.employee?.department?.name || 'Unassigned',
          departmentId: attObj.employee?.department?._id || null
        }
      };
    });
    
    console.log(`Found ${formattedAttendances.length} attendance records`);
    res.json(formattedAttendances);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== EMPLOYEE REPORTS ====================

// Generate employee report
router.get('/employees', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Generating employee report');
    
    const { department, status, search } = req.query;
    let query = {};
    
    if (department && department !== '') query.department = department;
    if (status && status !== '') query.isActive = status === 'active';
    if (search && search !== '') {
      query.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }
    
    const employees = await Employee.find(query)
      .populate('department', 'name description')
      .select('-__v')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${employees.length} employees`);
    res.json(employees);
  } catch (err) {
    console.error('Error generating employee report:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get employee report summary
router.get('/employees/summary', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const activeEmployees = await Employee.countDocuments({ isActive: true });
    const inactiveEmployees = await Employee.countDocuments({ isActive: false });
    
    const departmentStats = await Employee.aggregate([
      { $match: { isActive: true } },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'deptInfo' } },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$deptInfo.name', 'Unassigned'] }, count: { $sum: 1 } } }
    ]);
    
    const genderStats = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      departmentStats,
      genderStats
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== ATTENDANCE REPORTS ====================

// Generate attendance report
router.get('/attendance', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Generating attendance report');
    
    const { month, year, department, status, employeeId, startDate, endDate } = req.query;
    let query = {};
    
    // Date range filter
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    if (status && status !== 'all') query.status = status;
    if (employeeId && employeeId !== '') query.employee = employeeId;
    
    let attendances = await Attendance.find(query)
      .populate('employee', 'fullname email department position')
      .sort({ date: -1 });
    
    // Filter by department if specified
    if (department && department !== '') {
      attendances = attendances.filter(a => 
        a.employee?.department?._id?.toString() === department ||
        a.employee?.department?.toString() === department
      );
    }
    
    console.log(`Found ${attendances.length} attendance records`);
    res.json(attendances);
  } catch (err) {
    console.error('Error generating attendance report:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get attendance report summary
router.get('/attendance/summary', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { month, year } = req.query;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    const attendances = await Attendance.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalLate = attendances.filter(a => a.status === 'late').length;
    const totalAbsent = Math.max(0, totalEmployees - attendances.length);
    
    const dailyStats = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      const date = new Date(year, month - 1, i);
      const dayAttendances = attendances.filter(a => 
        new Date(a.date).getDate() === i
      );
      dailyStats.push({
        date: i,
        present: dayAttendances.filter(a => a.status === 'present').length,
        late: dayAttendances.filter(a => a.status === 'late').length,
        total: dayAttendances.length
      });
    }
    
    res.json({
      totalEmployees,
      totalPresent,
      totalLate,
      totalAbsent,
      attendanceRate: totalEmployees > 0 ? ((totalPresent / totalEmployees) * 100).toFixed(1) : 0,
      dailyStats
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== PAYROLL REPORTS ====================

// Generate payroll report
router.get('/payroll', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Generating payroll report');
    
    const { month, year, department, employeeId, status } = req.query;
    let query = {};
    
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }
    
    if (status === 'paid') query.isPaid = true;
    if (status === 'pending') query.isPaid = false;
    if (employeeId && employeeId !== '') query.employee = employeeId;
    
    let payrolls = await Payroll.find(query)
      .populate('employee', 'fullname email position department salary')
      .sort({ year: -1, month: -1 });
    
    // Filter by department if specified
    if (department && department !== '') {
      payrolls = payrolls.filter(p => 
        p.employee?.department?._id?.toString() === department ||
        p.employee?.department?.toString() === department
      );
    }
    
    console.log(`Found ${payrolls.length} payroll records`);
    res.json(payrolls);
  } catch (err) {
    console.error('Error generating payroll report:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get payroll report summary
router.get('/payroll/summary', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { month, year, department } = req.query;
    let query = { month: parseInt(month), year: parseInt(year) };
    
    let payrolls = await Payroll.find(query)
      .populate('employee', 'department');
    
    if (department && department !== '') {
      payrolls = payrolls.filter(p => 
        p.employee?.department?._id?.toString() === department ||
        p.employee?.department?.toString() === department
      );
    }
    
    const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalBasicSalary = payrolls.reduce((sum, p) => sum + (p.basicSalary || 0), 0);
    const totalTax = payrolls.reduce((sum, p) => sum + (p.taxDeductions || 0), 0);
    const totalBonuses = payrolls.reduce((sum, p) => sum + (p.bonuses || 0), 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0);
    
    res.json({
      totalRecords: payrolls.length,
      totalPayroll,
      totalBasicSalary,
      totalTax,
      totalBonuses,
      totalDeductions,
      paidCount: payrolls.filter(p => p.isPaid).length,
      pendingCount: payrolls.filter(p => !p.isPaid).length,
      averageSalary: payrolls.length > 0 ? totalPayroll / payrolls.length : 0
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== LEAVE REPORTS ====================

// Generate leave report
router.get('/leaves', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Generating leave report');
    
    const { status, department, employeeId, startDate, endDate, leaveType } = req.query;
    let query = {};
    
    if (status && status !== 'all') query.status = status;
    if (employeeId && employeeId !== '') query.employee = employeeId;
    if (leaveType && leaveType !== '') query.leaveType = leaveType;
    
    // Date range filter
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    } else if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }
    
    let leaves = await Leave.find(query)
      .populate('employee', 'fullname email department position')
      .populate('reviewedBy', 'fullname')
      .sort({ createdAt: -1 });
    
    // Filter by department if specified
    if (department && department !== '') {
      leaves = leaves.filter(l => 
        l.employee?.department?._id?.toString() === department ||
        l.employee?.department?.toString() === department
      );
    }
    
    console.log(`Found ${leaves.length} leave records`);
    res.json(leaves);
  } catch (err) {
    console.error('Error generating leave report:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get leave report summary
router.get('/leaves/summary', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { year, department } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);
    
    let leaves = await Leave.find({
      startDate: { $gte: startDate, $lte: endDate }
    }).populate('employee', 'department');
    
    if (department && department !== '') {
      leaves = leaves.filter(l => 
        l.employee?.department?._id?.toString() === department ||
        l.employee?.department?.toString() === department
      );
    }
    
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length;
    
    const leaveTypeStats = {
      'Annual leave': leaves.filter(l => l.leaveType === 'Annual leave').length,
      'Sick leave': leaves.filter(l => l.leaveType === 'Sick leave').length,
      'Maternity leave': leaves.filter(l => l.leaveType === 'Maternity leave').length,
      'Emergency leave': leaves.filter(l => l.leaveType === 'Emergency leave').length
    };
    
    const monthlyStats = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(targetYear, i, 1);
      const monthEnd = new Date(targetYear, i + 1, 0);
      const monthLeaves = leaves.filter(l => 
        new Date(l.startDate) >= monthStart && new Date(l.startDate) <= monthEnd
      );
      monthlyStats.push({
        month: i + 1,
        count: monthLeaves.length
      });
    }
    
    res.json({
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      approvalRate: totalLeaves > 0 ? ((approvedLeaves / totalLeaves) * 100).toFixed(1) : 0,
      leaveTypeStats,
      monthlyStats
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== DEPARTMENT REPORTS ====================

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
      averageSalary: dept.employees.length > 0 
        ? dept.employees.reduce((sum, e) => sum + (e.salary || 0), 0) / dept.employees.length 
        : 0,
      employees: dept.employees.map(e => ({
        name: e.fullname,
        email: e.email,
        position: e.position,
        salary: e.salary
      }))
    }));
    
    res.json(report);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== PERFORMANCE REPORTS ====================

// Generate performance report
router.get('/performance', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { year, department } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const Performance = require('../models/Performance');
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);
    
    let query = { reviewDate: { $gte: startDate, $lte: endDate } };
    
    let performances = await Performance.find(query)
      .populate('employee', 'fullname email department position')
      .populate('reviewer', 'fullname')
      .sort({ reviewDate: -1 });
    
    if (department && department !== '') {
      performances = performances.filter(p => 
        p.employee?.department?._id?.toString() === department ||
        p.employee?.department?.toString() === department
      );
    }
    
    const averageRating = performances.length > 0 
      ? performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.length 
      : 0;
    
    const ratingDistribution = {
      1: performances.filter(p => p.rating === 1).length,
      2: performances.filter(p => p.rating === 2).length,
      3: performances.filter(p => p.rating === 3).length,
      4: performances.filter(p => p.rating === 4).length,
      5: performances.filter(p => p.rating === 5).length
    };
    
    res.json({
      totalReviews: performances.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution,
      performances
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Reports routes are working!', timestamp: new Date() });
});

module.exports = router;