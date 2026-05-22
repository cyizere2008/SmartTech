const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

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

// ==================== TEST ROUTE ====================
router.get('/test', (req, res) => {
  res.json({ message: 'Leave routes are working!', timestamp: new Date() });
});

// ==================== GET ROUTES ====================

// Get my leaves (for employees)
router.get('/my-leaves', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Fetching my leaves for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    console.log('✅ Employee found:', employee.fullname);
    
    const leaves = await Leave.find({ employee: employee._id })
      .populate('employee', 'fullname email position')
      .populate('reviewedBy', 'fullname')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${leaves.length} leave requests`);
    res.json(leaves);
  } catch (err) {
    console.error('Error fetching my leaves:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all leaves (for HR/Admin)
router.get('/', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Fetching all leaves for HR/Admin');
    
    const { status, startDate, endDate } = req.query;
    let query = {};
    
    if (status && status !== 'all') query.status = status;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    
    const leaves = await Leave.find(query)
      .populate('employee', 'fullname email position department')
      .populate('reviewedBy', 'fullname')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${leaves.length} leave requests`);
    res.json(leaves);
  } catch (err) {
    console.error('Error fetching all leaves:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== POST ROUTES ====================

// Apply for leave (Employee only) - SIMPLIFIED VERSION
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('📝 New leave application request');
    console.log('Request body:', req.body);
    
    const { leaveType, startDate, endDate, reason } = req.body;
    
    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required'
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const employee = await getOrCreateEmployee(user);
    console.log('Employee:', employee.fullname, 'ID:', employee._id);
    
    // Create dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Start date:', start);
    console.log('End date:', end);
    
    // Simple validation - just check if end is after start
    if (end < start) {
      return res.status(400).json({ 
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    // Calculate total days
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    console.log('Total days:', totalDays);
    
    // Create leave request (simplified - no overlap check for now)
    const leave = new Leave({
      employee: employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      totalDays: totalDays,
      status: 'pending'
    });
    
    console.log('Saving leave request...');
    const savedLeave = await leave.save();
    console.log('✅ Leave saved! ID:', savedLeave._id);
    
    // Populate employee data
    await savedLeave.populate('employee', 'fullname email');
    
    console.log(`✅ Leave request submitted for ${employee.fullname}`);
    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leave: savedLeave
    });
    
  } catch (err) {
    console.error('❌ Error submitting leave:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + err.message,
      error: err.toString()
    });
  }
});

// ==================== PUT ROUTES ====================

// Approve/Reject leave (HR/Admin only)
router.put('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    console.log('📝 Reviewing leave request:', req.params.id);
    
    const { status, comments } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required' });
    }
    
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `Leave request already ${leave.status}` });
    }
    
    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    if (comments) leave.comments = comments;
    
    await leave.save();
    await leave.populate('employee', 'fullname email');
    await leave.populate('reviewedBy', 'fullname');
    
    console.log(`✅ Leave request ${status} for ${leave.employee.fullname}`);
    res.json({
      success: true,
      message: `Leave request ${status}`,
      leave
    });
  } catch (err) {
    console.error('Error reviewing leave:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ==================== DELETE ROUTES ====================

// Delete leave request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Check permission
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.id);
      const employee = await Employee.findOne({ email: user.email });
      
      if (leave.employee.toString() !== employee?._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (leave.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending requests can be deleted' });
      }
    }
    
    await leave.deleteOne();
    
    console.log(`✅ Leave request deleted`);
    res.json({ success: true, message: 'Leave request deleted successfully' });
  } catch (err) {
    console.error('Error deleting leave:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;