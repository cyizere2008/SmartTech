const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Helper function to get or create employee
const getOrCreateEmployee = async (userData) => {
  try {
    let employee = await Employee.findOne({ email: userData.email });
    
    if (!employee) {
      employee = new Employee({
        fullname: userData.fullname,
        email: userData.email,
        position: 'Employee',
        salary: 0,
        isActive: true,
        joiningDate: new Date()
      });
      await employee.save();
      console.log(`✅ Created employee for: ${userData.email}`);
    }
    
    return employee;
  } catch (err) {
    console.error('Error in getOrCreateEmployee:', err);
    throw err;
  }
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    // Find user
    let user = await User.findOne({ email });
    
    // If user doesn't exist, try to find employee and create user
    if (!user) {
      console.log('User not found, checking employee...');
      const existingEmployee = await Employee.findOne({ email });
      
      if (existingEmployee) {
        // Create user for existing employee
        user = new User({
          fullname: existingEmployee.fullname,
          email: email,
          password: password || 'password123',
          role: 'employee',
          employeeId: existingEmployee._id
        });
        await user.save();
        console.log('✅ Created user for existing employee');
      } else {
        // Create both employee and user
        const employee = new Employee({
          fullname: email.split('@')[0],
          email: email,
          position: 'Employee',
          salary: 0,
          isActive: true,
          joiningDate: new Date()
        });
        await employee.save();
        console.log('✅ Created new employee');
        
        user = new User({
          fullname: employee.fullname,
          email: email,
          password: password || 'password123',
          role: 'employee',
          employeeId: employee._id
        });
        await user.save();
        console.log('✅ Created new user');
      }
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      'secretkey',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Check if employee already exists
    let employee = await Employee.findOne({ email });
    
    if (!employee) {
      // Create employee
      employee = new Employee({
        fullname: fullname,
        email: email,
        position: 'Employee',
        salary: 0,
        isActive: true,
        joiningDate: new Date()
      });
      await employee.save();
      console.log('✅ Employee created');
    } else {
      console.log('✅ Using existing employee');
    }
    
    // Create user
    user = new User({
      fullname: fullname,
      email: email,
      password: password,
      role: role || 'employee',
      employeeId: employee._id
    });
    await user.save();
    console.log('✅ User created');
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      'secretkey',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }
    
    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;