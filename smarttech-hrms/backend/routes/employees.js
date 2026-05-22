const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Get all employees (HR/Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('department', 'name description')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get single employee
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name description');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Add new employee (HR/Admin only)
router.post('/', authMiddleware, requireRole(['admin', 'hr_manager']), upload.single('profilePhoto'), async (req, res) => {
  try {
    const employeeData = { ...req.body };
    
    if (req.file) {
      employeeData.profilePhoto = `/uploads/${req.file.filename}`;
    }
    
    // Check if employee with same email exists
    const existingEmployee = await Employee.findOne({ email: employeeData.email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }
    
    const employee = new Employee(employeeData);
    await employee.save();
    
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update employee (HR/Admin only)
router.put('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), upload.single('profilePhoto'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      // Delete old photo if exists
      const oldEmployee = await Employee.findById(req.params.id);
      if (oldEmployee && oldEmployee.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', oldEmployee.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.profilePhoto = `/uploads/${req.file.filename}`;
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete employee (HR/Admin only)
router.delete('/:id', authMiddleware, requireRole(['admin', 'hr_manager']), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Delete profile photo if exists
    if (employee.profilePhoto) {
      const photoPath = path.join(__dirname, '..', employee.profilePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Search employees
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const employees = await Employee.find().populate('department', 'name');
      return res.json(employees);
    }
    
    const employees = await Employee.find({
      $or: [
        { fullname: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { position: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).populate('department', 'name');
    
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;