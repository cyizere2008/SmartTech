const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Department = require('../models/Department');
const { authMiddleware } = require('../middleware/auth');

// Get dashboard statistics (Total Employees, Present Today, Pending Leaves, Monthly Payroll)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // 1. Get total active employees
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    
    // 2. Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('employee', 'fullname');
    
    const presentToday = todayAttendance.filter(a => 
      a.status === 'present' || a.status === 'late'
    ).length;
    
    // 3. Get pending leaves count
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    
    // 4. Get current month payroll total
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const monthlyPayrolls = await Payroll.find({ 
      month: currentMonth, 
      year: currentYear,
      isPaid: true
    });
    
    const totalPayroll = monthlyPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    
    // Also get role-specific data
    let responseData = {
      totalEmployees,
      presentToday,
      pendingLeaves,
      totalPayroll
    };
    
    // If user is employee, get their specific data
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      const employee = await Employee.findOne({ email: user.email });
      
      if (employee) {
        // Get employee's attendance for today
        const myAttendance = await Attendance.findOne({
          employee: employee._id,
          date: { $gte: today, $lt: tomorrow }
        });
        
        // Get employee's pending leaves
        const myPendingLeaves = await Leave.countDocuments({
          employee: employee._id,
          status: 'pending'
        });
        
        // Get employee's last payroll
        const lastPayroll = await Payroll.findOne({
          employee: employee._id
        }).sort({ year: -1, month: -1 });
        
        responseData = {
          ...responseData,
          myAttendance: myAttendance ? {
            checkedIn: !!myAttendance.checkIn,
            checkedOut: !!myAttendance.checkOut,
            status: myAttendance.status
          } : null,
          myPendingLeaves,
          lastSalary: lastPayroll ? lastPayroll.netSalary : employee.salary
        };
      }
    }
    
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get recent activities
router.get('/recent-activities', authMiddleware, async (req, res) => {
  try {
    const activities = [];
    
    // Get recent leave requests (last 5)
    const recentLeaves = await Leave.find()
      .populate('employee', 'fullname')
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentLeaves.forEach(leave => {
      activities.push({
        type: 'leave',
        message: `${leave.employee?.fullname || 'Employee'} requested ${leave.leaveType} - ${leave.status}`,
        time: leave.createdAt,
        icon: getActivityIcon('leave', leave.status),
        status: leave.status
      });
    });
    
    // Get recent employee additions (last 3)
    const recentEmployees = await Employee.find()
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(3);
    
    recentEmployees.forEach(emp => {
      activities.push({
        type: 'employee',
        message: `New employee ${emp.fullname} joined ${emp.department?.name || 'company'}`,
        time: emp.createdAt,
        icon: '👤',
        status: 'added'
      });
    });
    
    // Get recent payroll processing (last 3)
    const recentPayrolls = await Payroll.find()
      .populate('employee', 'fullname')
      .sort({ createdAt: -1 })
      .limit(3);
    
    recentPayrolls.forEach(pay => {
      activities.push({
        type: 'payroll',
        message: `Payroll processed for ${pay.employee?.fullname} - $${pay.netSalary?.toLocaleString()}`,
        time: pay.createdAt,
        icon: '💰',
        status: pay.isPaid ? 'paid' : 'pending'
      });
    });
    
    // Get recent attendance records (last 3)
    const recentAttendance = await Attendance.find()
      .populate('employee', 'fullname')
      .sort({ date: -1 })
      .limit(3);
    
    recentAttendance.forEach(att => {
      activities.push({
        type: 'attendance',
        message: `${att.employee?.fullname} ${att.checkIn ? 'checked in' : 'was absent'} - ${att.status}`,
        time: att.date,
        icon: getActivityIcon('attendance', att.status),
        status: att.status
      });
    });
    
    // Sort by time and get latest 8
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8)
      .map(activity => ({
        ...activity,
        timeAgo: getTimeAgo(activity.time)
      }));
    
    res.json(sortedActivities);
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get department-wise statistics
router.get('/department-stats', authMiddleware, async (req, res) => {
  try {
    // Get all departments with employee counts
    const departments = await Department.find();
    
    const stats = [];
    for (const dept of departments) {
      const employees = await Employee.find({ department: dept._id, isActive: true });
      const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      
      stats.push({
        department: dept.name,
        departmentId: dept._id,
        employeeCount: employees.length,
        totalSalary: totalSalary,
        averageSalary: employees.length > 0 ? totalSalary / employees.length : 0,
        description: dept.description
      });
    }
    
    // Also include unassigned employees
    const unassignedEmployees = await Employee.find({ 
      department: { $exists: false, $eq: null },
      isActive: true 
    });
    
    if (unassignedEmployees.length > 0) {
      const unassignedSalary = unassignedEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      stats.push({
        department: 'Unassigned',
        departmentId: null,
        employeeCount: unassignedEmployees.length,
        totalSalary: unassignedSalary,
        averageSalary: unassignedEmployees.length > 0 ? unassignedSalary / unassignedEmployees.length : 0,
        description: 'Employees without department assignment'
      });
    }
    
    // Sort by employee count descending
    stats.sort((a, b) => b.employeeCount - a.employeeCount);
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching department stats:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get attendance trends for last 7 days
router.get('/attendance-trends', authMiddleware, async (req, res) => {
  try {
    const trends = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const attendances = await Attendance.find({
        date: { $gte: date, $lt: nextDate }
      }).populate('employee', 'fullname department');
      
      const totalEmployees = await Employee.countDocuments({ isActive: true });
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        present: attendances.filter(a => a.status === 'present').length,
        late: attendances.filter(a => a.status === 'late').length,
        absent: totalEmployees - attendances.length,
        total: attendances.length,
        attendanceRate: totalEmployees > 0 ? ((attendances.length / totalEmployees) * 100).toFixed(1) : 0
      });
    }
    
    res.json(trends);
  } catch (err) {
    console.error('Error fetching attendance trends:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get upcoming events (birthdays, work anniversaries)
router.get('/upcoming-events', authMiddleware, async (req, res) => {
  try {
    const events = [];
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);
    
    // Get upcoming birthdays
    const employees = await Employee.find({ isActive: true });
    
    employees.forEach(emp => {
      if (emp.dateOfBirth) {
        const birthday = new Date(emp.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBirthday >= today && thisYearBirthday <= next30Days) {
          events.push({
            type: 'birthday',
            employee: emp.fullname,
            date: thisYearBirthday,
            daysLeft: Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24)),
            icon: '🎂'
          });
        }
      }
      
      // Get upcoming work anniversaries
      if (emp.joiningDate) {
        const joiningDate = new Date(emp.joiningDate);
        const thisYearAnniversary = new Date(today.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());
        const yearsWorked = today.getFullYear() - joiningDate.getFullYear();
        
        if (thisYearAnniversary >= today && thisYearAnniversary <= next30Days && yearsWorked > 0) {
          events.push({
            type: 'anniversary',
            employee: emp.fullname,
            date: thisYearAnniversary,
            yearsWorked: yearsWorked,
            daysLeft: Math.ceil((thisYearAnniversary - today) / (1000 * 60 * 60 * 24)),
            icon: '🏆'
          });
        }
      }
    });
    
    // Sort by date
    events.sort((a, b) => a.date - b.date);
    
    res.json(events.slice(0, 5));
  } catch (err) {
    console.error('Error fetching upcoming events:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get monthly comparison data
router.get('/monthly-comparison', authMiddleware, async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    // Get current month stats
    const currentMonthPayroll = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } }
    ]);
    
    const currentMonthLeaves = await Leave.countDocuments({
      status: 'approved',
      $expr: {
        $and: [
          { $eq: [{ $month: '$startDate' }, currentMonth] },
          { $eq: [{ $year: '$startDate' }, currentYear] }
        ]
      }
    });
    
    // Get last month stats
    const lastMonthPayroll = await Payroll.aggregate([
      { $match: { month: lastMonth, year: lastMonthYear, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } }
    ]);
    
    const lastMonthLeaves = await Leave.countDocuments({
      status: 'approved',
      $expr: {
        $and: [
          { $eq: [{ $month: '$startDate' }, lastMonth] },
          { $eq: [{ $year: '$startDate' }, lastMonthYear] }
        ]
      }
    });
    
    res.json({
      currentMonth: {
        payroll: currentMonthPayroll[0]?.total || 0,
        payrollCount: currentMonthPayroll[0]?.count || 0,
        leaves: currentMonthLeaves
      },
      lastMonth: {
        payroll: lastMonthPayroll[0]?.total || 0,
        payrollCount: lastMonthPayroll[0]?.count || 0,
        leaves: lastMonthLeaves
      },
      comparison: {
        payrollChange: calculatePercentageChange(
          lastMonthPayroll[0]?.total || 0,
          currentMonthPayroll[0]?.total || 0
        ),
        leavesChange: calculatePercentageChange(lastMonthLeaves, currentMonthLeaves)
      }
    });
  } catch (err) {
    console.error('Error fetching monthly comparison:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Helper function to get time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Helper function to get activity icon
function getActivityIcon(type, status) {
  const icons = {
    leave: {
      pending: '📝',
      approved: '✅',
      rejected: '❌'
    },
    attendance: {
      present: '✓',
      late: '⏰',
      absent: '❌'
    }
  };
  
  if (type === 'leave') {
    return icons.leave[status] || '📝';
  }
  if (type === 'attendance') {
    return icons.attendance[status] || '📊';
  }
  return '📌';
}

// Helper function to calculate percentage change
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

module.exports = router;