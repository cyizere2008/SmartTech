const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    // Find user
    let user = await User.findOne({ email });
    
    // If no user exists, create a test user
    if (!user) {
      console.log('Creating test user...');
      
      // Create employee first
      const employee = new Employee({
        fullname: 'Test Employee',
        email: email,
        position: 'Software Developer',
        salary: 50000,
        isActive: true
      });
      await employee.save();
      
      // Create user
      user = new User({
        fullname: 'Test Employee',
        email: email,
        password: password || 'password123',
        role: 'employee',
        employeeId: employee._id
      });
      await user.save();
      console.log('Test user created successfully');
    }
    
    // Check password (for existing users)
    if (user.password && password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
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
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create employee
    const employee = new Employee({
      fullname: fullname,
      email: email,
      position: 'New Employee',
      salary: 0,
      isActive: true
    });
    await employee.save();
    
    // Create user
    user = new User({
      fullname,
      email,
      password,
      role: role || 'employee',
      employeeId: employee._id
    });
    await user.save();
    
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