const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Attendance routes are working!', timestamp: new Date() });
});

// Helper function to get or create employee for user (FIXED for duplicate key)
const getOrCreateEmployee = async (user) => {
  try {
    // First try to find employee by email
    let employee = await Employee.findOne({ email: user.email });
    
    if (!employee) {
      console.log(`Creating new employee for: ${user.email}`);
      try {
        // Create employee if not exists
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
        
        // Update user with employeeId
        user.employeeId = employee._id;
        await user.save();
      } catch (err) {
        // If duplicate key error, try to find the employee again
        if (err.code === 11000) {
          console.log(`Duplicate key error, fetching existing employee for: ${user.email}`);
          employee = await Employee.findOne({ email: user.email });
          if (employee && !user.employeeId) {
            user.employeeId = employee._id;
            await user.save();
          }
        } else {
          throw err;
        }
      }
    }
    
    return employee;
  } catch (error) {
    console.error('Error in getOrCreateEmployee:', error);
    throw error;
  }
};

// Check In
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Check-in request for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get or create employee record
    const employee = await getOrCreateEmployee(user);
    console.log('✅ Employee found:', employee.fullname);
    
    // Check if already checked in today
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
    const lateThreshold = 9 * 60 + 30; // 9:30 AM
    
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
    
    console.log(`✅ Check-in successful for ${employee.fullname}`);
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
    
    console.log(`✅ Check-out successful for ${employee.fullname}`);
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

// Get today's attendance
router.get('/today', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Today attendance request');
    
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
    console.error('Error in today attendance:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get attendance history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching attendance history...');
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    console.log('✅ Employee found:', employee.fullname, 'ID:', employee._id);
    
    const { limit = 30 } = req.query;
    
    const attendances = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    console.log(`Found ${attendances.length} attendance records`);
    res.json(attendances);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get attendance statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching attendance stats...');
    
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
    const workingDays = totalDays - 8; // Approximate working days
    const totalAbsent = Math.max(0, workingDays - attendances.length);
    const attendanceRate = workingDays > 0 ? ((attendances.length / workingDays) * 100).toFixed(1) : 0;
    
    console.log('Stats calculated:', { totalPresent, totalLate, totalAbsent, attendanceRate });
    
    res.json({
      totalPresent,
      totalLate,
      totalAbsent,
      attendanceRate: parseFloat(attendanceRate)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Create sample data
router.post('/create-sample', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Creating sample data...');
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    
    const today = new Date();
    let createdCount = 0;
    
    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const checkInTime = new Date(date);
      const randomHour = Math.random() > 0.8 ? 9 + Math.floor(Math.random() * 2) : 9;
      const randomMinute = Math.floor(Math.random() * 60);
      checkInTime.setHours(randomHour, randomMinute, 0);
      
      const checkOutTime = new Date(date);
      checkOutTime.setHours(17, Math.floor(Math.random() * 30), 0);
      
      const isLate = checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30);
      const status = isLate ? 'late' : 'present';
      const lateMinutes = isLate ? (checkInTime.getHours() - 9) * 60 + checkInTime.getMinutes() - 30 : 0;
      
      const existing = await Attendance.findOne({ employee: employee._id, date: date });
      if (!existing) {
        const attendance = new Attendance({
          employee: employee._id,
          date: date,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status: status,
          lateMinutes: lateMinutes
        });
        await attendance.save();
        createdCount++;
      }
    }
    
    console.log(`✅ Created ${createdCount} sample records`);
    res.json({
      success: true,
      message: `Created ${createdCount} sample attendance records`
    });
  } catch (err) {
    console.error('Error creating sample data:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;