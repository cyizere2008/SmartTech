const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/smarttech_hrms')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/payroll', require('./routes/payrollEmploye'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Test: http://localhost:${PORT}/api/test`);
  console.log(`📋 Attendance test: http://localhost:${PORT}/api/attendance/test`);
});