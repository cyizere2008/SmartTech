const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Attendance routes are working!', timestamp: new Date() });
});

// Helper function to get or create employee for user
const getOrCreateEmployee = async (user) => {
  try {
    let employee = await Employee.findOne({ email: user.email });
    
    if (!employee) {
      console.log(`Creating new employee for: ${user.email}`);
      employee = new Employee({
        fullname: user.fullname,
        email: user.email,
        position: 'Employee',
        salary: 0,
        isActive: true,
        joiningDate: new Date()
      });
      await employee.save();
      console.log(`✅ Created new employee for: ${user.email}`);
      
      user.employeeId = employee._id;
      await user.save();
    }
    
    return employee;
  } catch (error) {
    console.error('Error in getOrCreateEmployee:', error);
    throw error;
  }
};

// ==================== CHECK IN/OUT ROUTES ====================

// Check In
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Check-in request for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    console.log('✅ Employee found:', employee.fullname);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'You have already checked in today!' });
    }
    
    const now = new Date();
    const checkInTime = now.getHours() * 60 + now.getMinutes();
    const lateThreshold = 9 * 60 + 30;
    
    let status = 'present';
    let lateMinutes = 0;
    
    if (checkInTime > lateThreshold) {
      status = 'late';
      lateMinutes = checkInTime - lateThreshold;
    }
    
    let attendance;
    if (existingAttendance) {
      attendance = existingAttendance;
      attendance.checkIn = now;
      attendance.status = status;
      attendance.lateMinutes = lateMinutes;
    } else {
      attendance = new Attendance({
        employee: employee._id,
        checkIn: now,
        date: today,
        status: status,
        lateMinutes: lateMinutes
      });
    }
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Checked in successfully',
      attendance: {
        id: attendance._id,
        checkIn: attendance.checkIn,
        status: attendance.status,
        lateMinutes: attendance.lateMinutes
      }
    });
  } catch (err) {
    console.error('❌ Check-in error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Check Out
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Check-out request for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!attendance) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'You have already checked out today!' });
    }
    
    attendance.checkOut = new Date();
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Checked out successfully',
      attendance: {
        id: attendance._id,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut
      }
    });
  } catch (err) {
    console.error('❌ Check-out error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== EMPLOYEE VIEW ROUTES ====================

// Get today's attendance
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    res.json(attendance);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get attendance history (for employee)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    
    const attendances = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(30);
    
    res.json(attendances);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get attendance stats (for employee)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const attendances = await Attendance.find({
      employee: employee._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalLate = attendances.filter(a => a.status === 'late').length;
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const workingDays = totalDays - 8;
    const totalAbsent = Math.max(0, workingDays - attendances.length);
    const attendanceRate = workingDays > 0 ? ((attendances.length / workingDays) * 100).toFixed(1) : 0;
    
    res.json({
      totalPresent,
      totalLate,
      totalAbsent,
      attendanceRate: parseFloat(attendanceRate)
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== HR/ADMIN ROUTES ====================

// Get all attendance for HR (with filters)
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
      .populate('employee', 'fullname email department position')
      .sort({ date: -1 });
    
    if (department && department !== '') {
      attendances = attendances.filter(a => 
        a.employee?.department?._id?.toString() === department ||
        a.employee?.department?.toString() === department
      );
    }
    
    console.log(`Found ${attendances.length} attendance records`);
    res.json(attendances);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get HR summary statistics
router.get('/hr/summary', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const { date, department } = req.query;
    let query = {};
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDate };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }
    
    let attendances = await Attendance.find(query)
      .populate('employee', 'fullname department');
    
    if (department && department !== '') {
      attendances = attendances.filter(a => 
        a.employee?.department?._id?.toString() === department ||
        a.employee?.department?.toString() === department
      );
    }
    
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalLate = attendances.filter(a => a.status === 'late').length;
    const totalAbsent = totalEmployees - attendances.length;
    const attendanceRate = totalEmployees > 0 ? ((totalPresent / totalEmployees) * 100).toFixed(1) : 0;
    
    res.json({
      totalEmployees,
      totalPresent,
      totalLate,
      totalAbsent: Math.max(0, totalAbsent),
      attendanceRate: parseFloat(attendanceRate)
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});


// ==================== ADD THESE NEW ROUTES ====================

// Get employee attendance history (for employee view) - NEW ROUTE
router.get('/employee/history', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching employee attendance history for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    console.log('✅ Employee found:', employee.fullname, 'ID:', employee._id);
    
    const attendances = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(30);
    
    console.log(`Found ${attendances.length} attendance records`);
    res.json(attendances);
  } catch (err) {
    console.error('Error fetching employee history:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get employee stats (for employee view) - NEW ROUTE
router.get('/employee/stats', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching employee stats for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const attendances = await Attendance.find({
      employee: employee._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalLate = attendances.filter(a => a.status === 'late').length;
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const workingDays = totalDays - 8;
    const totalAbsent = Math.max(0, workingDays - attendances.length);
    const attendanceRate = workingDays > 0 ? ((attendances.length / workingDays) * 100).toFixed(1) : 0;
    
    console.log('Employee stats calculated:', { totalPresent, totalLate, totalAbsent, attendanceRate });
    
    res.json({
      totalPresent,
      totalLate,
      totalAbsent,
      attendanceRate: parseFloat(attendanceRate)
    });
  } catch (err) {
    console.error('Error fetching employee stats:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;